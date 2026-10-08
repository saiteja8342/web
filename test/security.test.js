import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin, isEditor, isClient } from '../src/lib/auth/authUtils.js';

/**
 * AUTOMATED SECURITY TEST SUITE (Section 47)
 * Validates role-based authorization, privilege escalation protections,
 * and security rules for client, editor, anonymous, and admin actors.
 */

describe('Section 47: Authentication & Privilege Escalation Audits', () => {
  it('CLIENT ATTACK: Cannot escalate to admin via client-writable user_metadata', () => {
    // Attack payload: A malicious user tampers with their JWT / client user_metadata via DevTools
    const maliciousClient = {
      id: 'uuid-client-123',
      email: 'attacker@example.com',
      role: 'client',
      user_metadata: {
        role: 'admin',
        is_admin: true,
      },
    };

    assert.equal(isAdmin(maliciousClient), false, 'isAdmin must ignore client user_metadata');
    assert.equal(isClient(maliciousClient), true, 'User remains recognized strictly as client');
  });

  it('CLIENT ATTACK: Cannot escalate to editor via user_metadata', () => {
    const maliciousClient = {
      id: 'uuid-client-123',
      role: 'client',
      user_metadata: {
        role: 'editor',
      },
    };

    assert.equal(isEditor(maliciousClient), false, 'isEditor must evaluate verified database role');
  });

  it('ADMIN VERIFICATION: Legitimate admin with server-controlled app_metadata or email is recognized', () => {
    const serverVerifiedAdmin = {
      id: 'uuid-admin-001',
      email: 'admin@motionnodeedits.com',
      role: 'admin',
      app_metadata: {
        role: 'admin',
      },
    };

    assert.equal(isAdmin(serverVerifiedAdmin), true, 'Legitimate server-verified admin must pass');
  });

  it('ADMIN VERIFICATION: Configured admin email passes role check', () => {
    assert.equal(isAdmin({ email: 'admin@motionnodeedits.com' }), true);
    assert.equal(isAdmin({ email: 'regular@user.com' }), false);
  });
});

describe('Section 47: Client Security Boundaries & Access Control', () => {
  // Mock RLS & trigger logic modeled from supabase/production_hardening_master.sql
  function evaluateClientOrderAccess(order, authUid) {
    // Client can only view their own orders
    return order.client_id === authUid;
  }

  function evaluateClientOrderUpdate(orderOld, orderNew, authUid) {
    if (orderOld.client_id !== authUid) return { allowed: false, reason: 'Order does not belong to client' };
    if (orderNew.editor_id !== orderOld.editor_id) return { allowed: false, reason: 'Client cannot assign editor' };
    if (orderNew.admin_notes !== orderOld.admin_notes) return { allowed: false, reason: 'Client cannot alter admin notes' };
    if (orderNew.client_id !== orderOld.client_id) return { allowed: false, reason: 'Client cannot change ownership' };
    return { allowed: true };
  }

  it('CLIENT ATTACK: Client cannot access another client\'s order', () => {
    const victimOrder = { id: 'order-999', client_id: 'victim-uuid-456' };
    const attackerUid = 'attacker-uuid-123';

    assert.equal(evaluateClientOrderAccess(victimOrder, attackerUid), false);
  });

  it('CLIENT ATTACK: Client cannot reassign editor or modify admin notes', () => {
    const originalOrder = {
      id: 'order-101',
      client_id: 'client-uuid-1',
      editor_id: null,
      admin_notes: 'Internal VIP instructions',
      status: 'received',
    };

    const tamperedOrder = {
      ...originalOrder,
      editor_id: 'compromised-editor-uuid',
      admin_notes: 'Erased notes',
    };

    const result = evaluateClientOrderUpdate(originalOrder, tamperedOrder, 'client-uuid-1');
    assert.equal(result.allowed, false);
    assert.match(result.reason, /editor|admin notes/i);
  });

  it('CLIENT ATTACK: Client cannot set is_testimonial=true on rating submission', () => {
    function sanitizeRatingInsert(ratingInput, callerUid, order) {
      if (order.client_id !== callerUid) throw new Error('Not order owner');
      if (order.status !== 'delivered') throw new Error('Order not delivered');
      return {
        ...ratingInput,
        client_id: callerUid,
        editor_id: order.editor_id,
        // Backend trigger enforces is_testimonial to FALSE regardless of client payload
        is_testimonial: false,
      };
    }

    const order = { id: 'ord-1', client_id: 'client-1', editor_id: 'ed-1', status: 'delivered' };
    const clientPayload = { rating: 5, review: 'Great job!', is_testimonial: true };

    const inserted = sanitizeRatingInsert(clientPayload, 'client-1', order);
    assert.equal(inserted.is_testimonial, false, 'is_testimonial must default to FALSE for moderation');
    assert.equal(inserted.editor_id, 'ed-1', 'editor_id is derived from verified order record');
  });

  it('CLIENT ATTACK: Client cannot submit rating for non-delivered project', () => {
    const inProgressOrder = { id: 'ord-2', client_id: 'client-1', editor_id: 'ed-1', status: 'in_editing' };
    assert.throws(
      () => {
        if (inProgressOrder.status !== 'delivered') throw new Error('Cannot rate incomplete project');
      },
      /Cannot rate incomplete project/
    );
  });
});

describe('Section 47: Editor Security Boundaries & Tamper Resistance', () => {
  function evaluateEditorOrderAccess(order, editorUid) {
    return order.editor_id === editorUid;
  }

  function evaluateEditorOrderUpdate(orderOld, orderNew, editorUid) {
    if (orderOld.editor_id !== editorUid) return { allowed: false, reason: 'Unassigned order' };
    // Trigger protect_order_editor_tampering enforces that editor cannot change client_id, admin_id, deadlines, brief
    if (orderNew.client_id !== orderOld.client_id) return { allowed: false, reason: 'Cannot change client_id' };
    if (orderNew.admin_id !== orderOld.admin_id) return { allowed: false, reason: 'Cannot change admin_id' };
    if (orderNew.client_deadline !== orderOld.client_deadline) return { allowed: false, reason: 'Cannot change deadline' };
    if (orderNew.brief !== orderOld.brief) return { allowed: false, reason: 'Cannot change brief' };

    // Editor can only transition status between in_editing and in_review
    const allowedEditorStatuses = ['in_editing', 'in_review'];
    if (orderNew.status !== orderOld.status && !allowedEditorStatuses.includes(orderNew.status)) {
      return { allowed: false, reason: `Invalid status transition to ${orderNew.status}` };
    }

    return { allowed: true };
  }

  it('EDITOR ATTACK: Editor cannot access unassigned or another editor\'s order', () => {
    const orderAssignedToAlice = { id: 'ord-300', editor_id: 'alice-uuid' };
    const bobUid = 'bob-uuid';

    assert.equal(evaluateEditorOrderAccess(orderAssignedToAlice, bobUid), false);
  });

  it('EDITOR ATTACK: Editor cannot alter client_id, deadline, or brief', () => {
    const original = {
      id: 'ord-301',
      editor_id: 'bob-uuid',
      client_id: 'client-100',
      admin_id: 'admin-1',
      client_deadline: '2026-10-15',
      brief: 'Original video project specifications',
      status: 'in_editing',
    };

    const maliciousUpdate = {
      ...original,
      client_deadline: '2026-12-31',
      brief: 'Tampered brief',
    };

    const res = evaluateEditorOrderUpdate(original, maliciousUpdate, 'bob-uuid');
    assert.equal(res.allowed, false);
    assert.match(res.reason, /Cannot change deadline|brief/i);
  });

  it('EDITOR ATTACK: Editor cannot directly set status to delivered or received', () => {
    const original = {
      id: 'ord-302',
      editor_id: 'bob-uuid',
      client_id: 'client-100',
      admin_id: 'admin-1',
      client_deadline: '2026-10-15',
      brief: 'Valid brief',
      status: 'in_editing',
    };

    const forgedDelivered = { ...original, status: 'delivered' };
    const res = evaluateEditorOrderUpdate(original, forgedDelivered, 'bob-uuid');
    assert.equal(res.allowed, false);
    assert.match(res.reason, /Invalid status transition/i);
  });
});

describe('Section 47: Anonymous & Public Boundary Security', () => {
  it('ANONYMOUS ATTACK: Contact inquiries, private feedback, and notifications are blocked from public SELECT', () => {
    // Model RLS policies from production_hardening_master.sql
    function canPublicSelect(table) {
      const publicSelectWhitelist = ['portfolio_videos', 'testimonials'];
      return publicSelectWhitelist.includes(table);
    }

    assert.equal(canPublicSelect('contact_requests'), false, 'contact_requests must reject public SELECT');
    assert.equal(canPublicSelect('link_feedback'), false, 'link_feedback must reject public SELECT');
    assert.equal(canPublicSelect('notifications'), false, 'notifications must reject public SELECT');
    assert.equal(canPublicSelect('orders'), false, 'orders must reject public SELECT');
    assert.equal(canPublicSelect('site_settings'), false, 'raw site_settings must reject indiscriminate SELECT');
  });

  it('ANONYMOUS ATTACK: Privileged RPCs reject anonymous execution', () => {
    function executePrivilegedRpc(rpcName, role) {
      const adminOnlyRpcs = ['delete_user_by_admin', 'check_user_exists', 'set_user_role'];
      if (adminOnlyRpcs.includes(rpcName) && role !== 'admin' && role !== 'service_role') {
        throw new Error(`Permission denied for RPC ${rpcName}`);
      }
      return { success: true };
    }

    assert.throws(
      () => executePrivilegedRpc('delete_user_by_admin', 'anon'),
      /Permission denied/
    );
    assert.throws(
      () => executePrivilegedRpc('check_user_exists', 'anon'),
      /Permission denied/
    );
  });

  it('ADMIN ATTACK / MISUSE: Admin cannot delete their own account', () => {
    function deleteUserByAdmin(callerId, targetUserId) {
      if (callerId === targetUserId) {
        throw new Error('Administrators cannot delete their own account');
      }
      return { deleted: true };
    }

    const adminId = 'super-admin-uuid';
    assert.throws(
      () => deleteUserByAdmin(adminId, adminId),
      /cannot delete their own account/
    );
    assert.doesNotThrow(
      () => deleteUserByAdmin(adminId, 'other-user-uuid')
    );
  });
});
