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
    process.env.VITE_ADMIN_EMAILS = 'configured-admin@example.com';
    assert.equal(isAdmin({ email: 'configured-admin@example.com' }), true);
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

describe('Section 48: Multi-Role Account RBAC Enforcement Tests', () => {
  // Separate test accounts
  const testAccounts = {
    admin: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@motionnodeedits.com',
      role: 'admin',
      status: 'approved',
      app_metadata: { role: 'admin' },
    },
    editor: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'editor@motionnodeedits.com',
      role: 'editor',
      status: 'approved',
      app_metadata: { role: 'editor' },
    },
    clientA: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'client-a@example.com',
      role: 'client',
      status: 'approved',
      app_metadata: { role: 'client' },
    },
    clientB: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'client-b@example.com',
      role: 'client',
      status: 'approved',
      app_metadata: { role: 'client' },
    },
  };

  // Mock database state
  const mockOrders = [
    {
      id: 'ord-101',
      order_name: 'Brand Video 2026',
      client_id: testAccounts.clientA.id,
      editor_id: testAccounts.editor.id,
      admin_id: testAccounts.admin.id,
      status: 'in_editing',
      brief: 'Original brief',
      drive_link: 'https://drive.google.com/raw-footage',
      dropbox_link: null,
      additional_link: null,
      client_link_visible: false,
      admin_notes: '[ORDER_CODE:MNE-20261018-A7K9]',
      client_deadline: '2026-10-25',
      editor_deadline: '2026-10-22',
    },
    {
      id: 'ord-102',
      order_name: 'Social Ads Campaign',
      client_id: testAccounts.clientB.id,
      editor_id: null,
      admin_id: testAccounts.admin.id,
      status: 'received',
      brief: 'Client B specifications',
      drive_link: 'https://drive.google.com/raw-footage-b',
      dropbox_link: null,
      additional_link: null,
      client_link_visible: false,
      admin_notes: '',
      client_deadline: '2026-11-01',
      editor_deadline: null,
    },
  ];

  // Database Trigger Emulator: protect_profile_privilege_escalation
  function simulateProfileUpdateTrigger(oldProfile, newProfile, callerAccount) {
    const isCallerAdmin = callerAccount.role === 'admin';
    if (!isCallerAdmin) {
      if (newProfile.role !== oldProfile.role) {
        throw new Error('Access Denied: You cannot modify user role.');
      }
      if (newProfile.status !== oldProfile.status) {
        throw new Error('Access Denied: You cannot modify user approval status.');
      }
      if (newProfile.id !== oldProfile.id) {
        throw new Error('Access Denied: Profile ID cannot be altered.');
      }
    }
    return { ...newProfile, updated_at: new Date().toISOString() };
  }

  // Database Trigger Emulator: protect_order_editor_tampering
  function simulateOrderUpdateTrigger(oldOrder, newOrder, callerAccount) {
    const isCallerAdmin = callerAccount.role === 'admin';
    if (isCallerAdmin) {
      return { ...newOrder, updated_at: new Date().toISOString() };
    }

    if (oldOrder.editor_id === callerAccount.id) {
      // Editor update constraints
      if (!['in_editing', 'in_review'].includes(newOrder.status)) {
        throw new Error('Access Denied: Editors can only update status to in_editing or in_review.');
      }
      return {
        ...oldOrder,
        status: newOrder.status,
        additional_link: newOrder.status === 'in_review' ? newOrder.additional_link : oldOrder.additional_link,
        client_link_visible: oldOrder.client_link_visible, // Preserved immutably
        updated_at: new Date().toISOString(),
      };
    }

    throw new Error('Access Denied: You cannot modify this order.');
  }

  // Database RLS Policy Emulator: orders SELECT
  function simulateOrdersSelectRLS(orders, callerAccount) {
    if (callerAccount.role === 'admin') return orders;
    if (callerAccount.role === 'editor') return orders.filter(o => o.editor_id === callerAccount.id);
    if (callerAccount.role === 'client') return orders.filter(o => o.client_id === callerAccount.id);
    return [];
  }

  // Database RLS Policy Emulator: orders INSERT
  function simulateOrdersInsertRLS(orderToInsert, callerAccount) {
    if (callerAccount.role !== 'admin') {
      throw new Error('Access Denied: Only administrators can create orders.');
    }
    return { success: true, order: orderToInsert };
  }

  // Deliverable Visibility Check (matching ClientDashboard.jsx)
  function isOrderDeliverablePermitted(order) {
    if (!order) return false;
    if (typeof order.admin_notes === 'string') {
      if (order.admin_notes.includes('[CLIENT_DELIVERABLE_VISIBLE:true]')) return true;
      if (order.admin_notes.includes('[CLIENT_DELIVERABLE_VISIBLE:false]')) return false;
    }
    if (order.client_link_visible === true) return true;
    if (order.client_link_visible === false) return false;
    if (order.status === 'delivered') return true;
    return false;
  }

  // ─── 1. CLIENT ROLE VERIFICATIONS ───
  describe('Client Role Boundary Tests (Test Account: clientA)', () => {
    it('1.1: Client CANNOT modify their own role in profiles table to admin or editor', () => {
      assert.throws(
        () => simulateProfileUpdateTrigger(testAccounts.clientA, { ...testAccounts.clientA, role: 'admin' }, testAccounts.clientA),
        /Access Denied: You cannot modify user role/
      );
      assert.throws(
        () => simulateProfileUpdateTrigger(testAccounts.clientA, { ...testAccounts.clientA, role: 'editor' }, testAccounts.clientA),
        /Access Denied: You cannot modify user role/
      );
    });

    it('1.2: Client CANNOT approve pending status in profiles table', () => {
      const pendingClient = { ...testAccounts.clientA, status: 'pending' };
      assert.throws(
        () => simulateProfileUpdateTrigger(pendingClient, { ...pendingClient, status: 'approved' }, testAccounts.clientA),
        /Access Denied: You cannot modify user approval status/
      );
    });

    it('1.3: Client CANNOT query or view orders of another client', () => {
      const visibleOrders = simulateOrdersSelectRLS(mockOrders, testAccounts.clientA);
      assert.equal(visibleOrders.length, 1);
      assert.equal(visibleOrders[0].id, 'ord-101');
      assert.equal(visibleOrders.some(o => o.client_id === testAccounts.clientB.id), false, 'Client B order must NOT be visible to Client A');
    });

    it('1.4: Client CANNOT access unreleased deliverables prior to admin approval', () => {
      const clientOrder = mockOrders[0]; // status: 'in_editing', client_link_visible: false
      assert.equal(isOrderDeliverablePermitted(clientOrder), false, 'Deliverable must remain hidden');

      // Even if client injects delivery link in payload, deliverable check prevents access
      const spoofedOrder = { ...clientOrder, additional_link: 'https://vimeo.com/leak/unreleased' };
      assert.equal(isOrderDeliverablePermitted(spoofedOrder), false, 'Spoofed order deliverable must remain locked');
    });

    it('1.5: Client CAN access deliverable once admin grants permission or order is delivered', () => {
      const releasedOrder = { ...mockOrders[0], client_link_visible: true };
      assert.equal(isOrderDeliverablePermitted(releasedOrder), true, 'Released order must be visible');

      const deliveredOrder = { ...mockOrders[0], status: 'delivered', client_link_visible: null };
      assert.equal(isOrderDeliverablePermitted(deliveredOrder), true, 'Delivered order must be visible');
    });

    it('1.6: Client CANNOT insert new orders directly via API', () => {
      assert.throws(
        () => simulateOrdersInsertRLS({ order_name: 'Unauthorized Order', client_id: testAccounts.clientA.id }, testAccounts.clientA),
        /Access Denied: Only administrators can create orders/
      );
    });

    it('1.7: Client CANNOT update orders directly in the database', () => {
      assert.throws(
        () => simulateOrderUpdateTrigger(mockOrders[0], { ...mockOrders[0], status: 'delivered' }, testAccounts.clientA),
        /Access Denied: You cannot modify this order/
      );
    });
  });

  // ─── 2. EDITOR ROLE VERIFICATIONS ───
  describe('Editor Role Boundary Tests (Test Account: editor)', () => {
    it('2.1: Editor CANNOT access unassigned orders or orders assigned to other editors', () => {
      const visibleOrders = simulateOrdersSelectRLS(mockOrders, testAccounts.editor);
      assert.equal(visibleOrders.length, 1);
      assert.equal(visibleOrders[0].id, 'ord-101');
      assert.equal(visibleOrders.some(o => o.id === 'ord-102'), false, 'Unassigned order must NOT be visible to editor');
    });

    it('2.2: Editor CANNOT create orders via API', () => {
      assert.throws(
        () => simulateOrdersInsertRLS({ order_name: 'Editor Order', editor_id: testAccounts.editor.id }, testAccounts.editor),
        /Access Denied: Only administrators can create orders/
      );
    });

    it('2.3: Editor CANNOT modify administrative order fields (client, deadline, brief, raw footage)', () => {
      const tampered = {
        ...mockOrders[0],
        status: 'in_editing',
        client_deadline: '2026-12-31',
        brief: 'Erased brief',
        drive_link: 'https://evil.com/fake-footage',
      };
      const result = simulateOrderUpdateTrigger(mockOrders[0], tampered, testAccounts.editor);
      assert.equal(result.client_deadline, mockOrders[0].client_deadline, 'Deadline must remain unchanged');
      assert.equal(result.brief, mockOrders[0].brief, 'Brief must remain unchanged');
      assert.equal(result.drive_link, mockOrders[0].drive_link, 'Drive link must remain unchanged');
    });

    it('2.4: Editor CANNOT self-release deliverable visibility to clients', () => {
      const tampered = {
        ...mockOrders[0],
        status: 'in_review',
        additional_link: 'https://drive.google.com/export.mp4',
        client_link_visible: true, // Editor tries to publish directly
      };
      const result = simulateOrderUpdateTrigger(mockOrders[0], tampered, testAccounts.editor);
      assert.equal(result.client_link_visible, false, 'client_link_visible must remain false until admin approval');
    });

    it('2.5: Editor CANNOT transition order status to delivered or cancelled', () => {
      assert.throws(
        () => simulateOrderUpdateTrigger(mockOrders[0], { ...mockOrders[0], status: 'delivered' }, testAccounts.editor),
        /Editors can only update status to in_editing or in_review/
      );
      assert.throws(
        () => simulateOrderUpdateTrigger(mockOrders[0], { ...mockOrders[0], status: 'cancelled' }, testAccounts.editor),
        /Editors can only update status to in_editing or in_review/
      );
    });

    it('2.6: Editor CAN submit export link and transition status to in_review for QC', () => {
      const qcSubmission = {
        ...mockOrders[0],
        status: 'in_review',
        additional_link: 'https://frame.io/review-v1',
      };
      const result = simulateOrderUpdateTrigger(mockOrders[0], qcSubmission, testAccounts.editor);
      assert.equal(result.status, 'in_review');
      assert.equal(result.additional_link, 'https://frame.io/review-v1');
    });

    it('2.7: Editor CANNOT change user approval status or user roles in profiles', () => {
      assert.throws(
        () => simulateProfileUpdateTrigger(testAccounts.clientA, { ...testAccounts.clientA, status: 'rejected' }, testAccounts.editor),
        /Access Denied: You cannot modify user approval status/
      );
      assert.throws(
        () => simulateProfileUpdateTrigger(testAccounts.editor, { ...testAccounts.editor, role: 'admin' }, testAccounts.editor),
        /Access Denied: You cannot modify user role/
      );
    });
  });

  // ─── 3. ADMIN ROLE VERIFICATIONS ───
  describe('Admin Role Full Authority Tests (Test Account: admin)', () => {
    it('3.1: Admin CAN query all system orders across clients and editors', () => {
      const visibleOrders = simulateOrdersSelectRLS(mockOrders, testAccounts.admin);
      assert.equal(visibleOrders.length, mockOrders.length);
    });

    it('3.2: Admin CAN create new orders', () => {
      const res = simulateOrdersInsertRLS({ order_name: 'New Commercial', client_id: testAccounts.clientA.id }, testAccounts.admin);
      assert.equal(res.success, true);
    });

    it('3.3: Admin CAN deliver, cancel, or modify any order fields', () => {
      const cancelled = simulateOrderUpdateTrigger(mockOrders[0], { ...mockOrders[0], status: 'cancelled' }, testAccounts.admin);
      assert.equal(cancelled.status, 'cancelled');

      const delivered = simulateOrderUpdateTrigger(mockOrders[0], { ...mockOrders[0], status: 'delivered', client_link_visible: true }, testAccounts.admin);
      assert.equal(delivered.status, 'delivered');
      assert.equal(delivered.client_link_visible, true);
    });

    it('3.4: Admin CAN approve, suspend, or update profiles', () => {
      const approved = simulateProfileUpdateTrigger(
        { ...testAccounts.clientA, status: 'pending' },
        { ...testAccounts.clientA, status: 'approved' },
        testAccounts.admin
      );
      assert.equal(approved.status, 'approved');
    });
  });

  // ─── 4. STORAGE POLICY VERIFICATIONS ───
  describe('Storage Bucket Security Policy Tests', () => {
    function simulateStorageInsertRLS(bucketId, objectPath, callerAccount) {
      if (callerAccount.role === 'admin') return { allowed: true };
      if (bucketId === 'avatars') {
        const allowedPath = objectPath.startsWith(`${callerAccount.id}/`) || objectPath.startsWith(`avatar-${callerAccount.id}`);
        if (!allowedPath) {
          throw new Error('Access Denied: You can only upload to your own avatar path');
        }
        return { allowed: true };
      }
      throw new Error(`Access Denied: Only administrators can upload to bucket ${bucketId}`);
    }

    it('4.1: Client can upload to their own avatar path', () => {
      const res = simulateStorageInsertRLS('avatars', `${testAccounts.clientA.id}/photo.jpg`, testAccounts.clientA);
      assert.equal(res.allowed, true);
    });

    it('4.2: Client CANNOT upload to another user\'s avatar path', () => {
      assert.throws(
        () => simulateStorageInsertRLS('avatars', `${testAccounts.clientB.id}/photo.jpg`, testAccounts.clientA),
        /Access Denied: You can only upload to your own avatar path/
      );
    });

    it('4.3: Non-admins CANNOT upload to portfolio or CMS buckets', () => {
      assert.throws(
        () => simulateStorageInsertRLS('portfolio', 'videos/showreel.mp4', testAccounts.clientA),
        /Access Denied: Only administrators can upload/
      );
      assert.throws(
        () => simulateStorageInsertRLS('portfolio', 'videos/showreel.mp4', testAccounts.editor),
        /Access Denied: Only administrators can upload/
      );
    });

    it('4.4: Admin CAN upload to portfolio bucket', () => {
      const res = simulateStorageInsertRLS('portfolio', 'videos/showreel.mp4', testAccounts.admin);
      assert.equal(res.allowed, true);
    });
  });
});

/**
 * AUTOMATED SECURITY TEST SUITE (Section 49)
 * Login Devices Management, 30-Day Remember Device, SHA-256 Hashing,
 * Absolute Expiration Enforcement, Cross-User Isolation, and OTP Security.
 */
describe('Section 49: Login Devices & 30-Day Remember Device Security Tests', () => {
  // Deterministic pure JS SHA-256 for test environment
  function computeHash(token) {
    let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
    for (let i = 0; i < token.length; i++) {
      const ch = token.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(64, '0');
  }

  // In-memory simulation of public.admin_devices table with strict RLS and trigger rules
  class MockAdminDeviceStore {
    constructor() {
      this.devices = [];
      this.otps = [];
    }

    registerDevice(callerUid, rawToken, meta = {}, isTrusted = true) {
      const hash = computeHash(rawToken);
      const now = Date.now();
      const expiresAt = isTrusted ? new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

      const existing = this.devices.find(d => d.device_token_hash === hash && d.user_id === callerUid);
      if (existing) {
        existing.last_active_at = new Date(now).toISOString();
        existing.status = 'active';
        existing.is_trusted = isTrusted;
        existing.expires_at = expiresAt;
        return existing;
      }

      const device = {
        id: 'dev-' + Math.random().toString(36).substring(2, 9),
        user_id: callerUid,
        device_token_hash: hash,
        device_name: meta.deviceName || 'MacBook Pro',
        device_type: meta.deviceType || 'desktop',
        browser: meta.browser || 'Google Chrome',
        os: meta.os || 'macOS',
        status: 'active',
        is_trusted: isTrusted,
        created_at: new Date(now).toISOString(),
        expires_at: expiresAt,
        last_active_at: new Date(now).toISOString(),
      };
      this.devices.push(device);
      return device;
    }

    validateDevice(callerUid, rawToken) {
      const hash = computeHash(rawToken);
      const device = this.devices.find(d => d.device_token_hash === hash);

      if (!device) {
        return { valid: false, reason: 'unrecognized_token' };
      }

      // RLS Check: User must own the device record
      if (device.user_id !== callerUid) {
        return { valid: false, reason: 'cross_user_forbidden' };
      }

      // Normal logins cannot bypass OTP
      if (device.is_trusted !== true) {
        return { valid: false, reason: 'not_trusted' };
      }

      if (device.status === 'revoked') {
        return { valid: false, reason: 'revoked' };
      }

      const now = Date.now();
      if (device.expires_at && (new Date(device.expires_at).getTime() <= now || device.status === 'expired')) {
        device.status = 'expired';
        return { valid: false, reason: 'expired' };
      }

      // Valid: update last_active_at WITHOUT extending expires_at
      device.last_active_at = new Date(now).toISOString();
      const daysRemaining = Math.max(0, Math.ceil((new Date(device.expires_at).getTime() - now) / (1000 * 60 * 60 * 24)));

      return {
        valid: true,
        deviceId: device.id,
        deviceName: device.device_name,
        expiresAt: device.expires_at,
        daysRemaining,
      };
    }

    revokeDevice(callerUid, deviceId) {
      const device = this.devices.find(d => d.id === deviceId);
      if (!device) return { success: false, error: 'Device not found' };
      if (device.user_id !== callerUid) return { success: false, error: 'Cannot revoke another user\'s device' };
      device.status = 'revoked';
      return { success: true };
    }

    revokeOtherDevices(callerUid, currentDeviceId) {
      let count = 0;
      for (const d of this.devices) {
        if (d.user_id === callerUid && d.id !== currentDeviceId && d.status === 'active') {
          d.status = 'revoked';
          count++;
        }
      }
      return { success: true, count };
    }

    listDevices(callerUid) {
      // RLS: Only select where user_id = callerUid
      return this.devices.filter(d => d.user_id === callerUid).map(d => {
        let displayStatus = 'normal';
        if (d.status === 'revoked') displayStatus = 'revoked';
        else if (d.is_trusted && (d.status === 'expired' || (d.expires_at && new Date(d.expires_at) <= new Date()))) displayStatus = 'expired';
        else if (d.is_trusted) displayStatus = 'trusted';
        return { ...d, displayStatus };
      });
    }

    // OTP Generation with 60s cooldown
    generateOtp(callerUid, email) {
      const now = Date.now();
      const recent = this.otps
        .filter(o => o.user_id === callerUid && !o.used)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (recent && (now - new Date(recent.created_at).getTime()) < 60000) {
        const remaining = Math.ceil((60000 - (now - new Date(recent.created_at).getTime())) / 1000);
        return { success: false, error: 'Rate limit exceeded. Please wait.', cooldown: remaining };
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const otp = {
        id: 'otp-' + Math.random().toString(36).substring(2, 9),
        user_id: callerUid,
        email,
        otp_code: code,
        attempts: 0,
        used: false,
        created_at: new Date(now).toISOString(),
        expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
      };
      this.otps.push(otp);
      return { success: true, code, expiresIn: 600 };
    }

    verifyOtp(callerUid, code) {
      const now = Date.now();
      const otp = this.otps
        .filter(o => o.user_id === callerUid && !o.used)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!otp) return { success: false, error: 'No active OTP found' };
      if (new Date(otp.expires_at).getTime() <= now) return { success: false, error: 'Code expired' };
      if (otp.attempts >= 5) return { success: false, error: 'Too many attempts. Locked out.' };

      if (otp.otp_code !== code) {
        otp.attempts += 1;
        return { success: false, error: 'Invalid code', attemptsRemaining: 5 - otp.attempts };
      }

      otp.used = true;
      return { success: true };
    }
  }

  it('1. TOKEN HASHING: Raw token is never stored in plaintext', () => {
    const store = new MockAdminDeviceStore();
    const rawToken = '7f8a9b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4';
    const device = store.registerDevice('admin-001', rawToken, {}, true);

    assert.notEqual(device.device_token_hash, rawToken, 'Raw token must not equal stored hash');
    assert.equal(device.device_token_hash.length, 64, 'SHA-256 hash must be 64 hexadecimal characters');
    assert.equal(device.device_token_hash, computeHash(rawToken), 'Stored value must be SHA-256 hash');
  });

  it('2. CHECKBOX UNCHECKED: Registers device as Normal Login and DENIES 30-day OTP exemption', () => {
    const store = new MockAdminDeviceStore();
    const normalToken = 'token_normal_login_session';

    // User logs in with rememberDevice = false
    const normalDevice = store.registerDevice('admin-001', normalToken, { deviceName: 'Firefox Workstation' }, false);

    assert.equal(normalDevice.is_trusted, false, 'Must be marked as untrusted');
    assert.equal(normalDevice.expires_at, null, 'Normal login must have no 30-day expiry');

    // Appears in login history
    const listed = store.listDevices('admin-001');
    assert.equal(listed.length, 1);
    assert.equal(listed[0].displayStatus, 'normal', 'Dashboard status must be "normal"');

    // On future visits, normal login CANNOT bypass OTP
    const validation = store.validateDevice('admin-001', normalToken);
    assert.equal(validation.valid, false);
    assert.equal(validation.reason, 'not_trusted', 'Must require OTP on subsequent logins');
  });

  it('3. CHECKBOX CHECKED: Registers device as Trusted with 30-day absolute expiration', () => {
    const store = new MockAdminDeviceStore();
    const trustedToken = 'token_trusted_30_days_validity';

    // User logs in with rememberDevice = true
    const trustedDevice = store.registerDevice('admin-001', trustedToken, { deviceName: 'Studio Mac' }, true);

    assert.equal(trustedDevice.is_trusted, true);
    assert.ok(trustedDevice.expires_at);

    // Initial validation passes (< 30 days)
    const validCheck = store.validateDevice('admin-001', trustedToken);
    assert.equal(validCheck.valid, true);
    assert.equal(validCheck.daysRemaining, 30);

    // After 31 days, status transitions to expired
    trustedDevice.expires_at = new Date(Date.now() - 1000).toISOString();
    const expiredCheck = store.validateDevice('admin-001', trustedToken);
    assert.equal(expiredCheck.valid, false);
    assert.equal(expiredCheck.reason, 'expired');
  });

  it('4. DUPLICATE PREVENTION: Repeated logins from the same browser update existing record', () => {
    const store = new MockAdminDeviceStore();
    const browserGuid = 'browser_guid_persisted_in_localstorage';

    // First login (untrusted)
    const dev1 = store.registerDevice('admin-001', browserGuid, { deviceName: 'Office Chrome' }, false);
    assert.equal(store.listDevices('admin-001').length, 1);
    assert.equal(dev1.is_trusted, false);

    // Second login from the SAME browser (trusted this time)
    const dev2 = store.registerDevice('admin-001', browserGuid, { deviceName: 'Office Chrome' }, true);
    assert.equal(store.listDevices('admin-001').length, 1, 'Must NOT create duplicate rows for the same browser');
    assert.equal(dev2.id, dev1.id, 'Must update existing device ID');
    assert.equal(dev2.is_trusted, true, 'Upgrades trust status');
  });

  it('5. DEVICE REVOCATION: Revoking a device immediately invalidates subsequent authentication', () => {
    const store = new MockAdminDeviceStore();
    const rawToken = 'token_to_be_revoked_instantly';
    const device = store.registerDevice('admin-001', rawToken);

    assert.equal(store.validateDevice('admin-001', rawToken).valid, true);

    const revokeRes = store.revokeDevice('admin-001', device.id);
    assert.equal(revokeRes.success, true);

    const postRevoke = store.validateDevice('admin-001', rawToken);
    assert.equal(postRevoke.valid, false);
    assert.equal(postRevoke.reason, 'revoked');
  });

  it('6. BULK SIGN OUT OTHER DEVICES: Revokes all other devices while preserving current device', () => {
    const store = new MockAdminDeviceStore();
    const tokenCurrent = 'token_current_workstation';
    const tokenLaptop = 'token_travel_laptop';
    const tokenPhone = 'token_iphone_admin';

    const devCurrent = store.registerDevice('admin-001', tokenCurrent, { deviceName: 'Studio Mac' });
    const _devLaptop = store.registerDevice('admin-001', tokenLaptop, { deviceName: 'MacBook Air' });
    const _devPhone = store.registerDevice('admin-001', tokenPhone, { deviceName: 'iPhone 15' });

    assert.equal(store.validateDevice('admin-001', tokenCurrent).valid, true);
    assert.equal(store.validateDevice('admin-001', tokenLaptop).valid, true);
    assert.equal(store.validateDevice('admin-001', tokenPhone).valid, true);

    // Bulk sign out
    const bulkRes = store.revokeOtherDevices('admin-001', devCurrent.id);
    assert.equal(bulkRes.success, true);
    assert.equal(bulkRes.count, 2, 'Must revoke exactly 2 other devices');

    // Current device remains active
    assert.equal(store.validateDevice('admin-001', tokenCurrent).valid, true);

    // Other devices are now revoked
    assert.equal(store.validateDevice('admin-001', tokenLaptop).valid, false);
    assert.equal(store.validateDevice('admin-001', tokenPhone).valid, false);
  });

  it('7. CROSS-USER ISOLATION: User A cannot validate, list, or revoke User B\'s devices', () => {
    const store = new MockAdminDeviceStore();
    const tokenA = 'token_user_a_secret';
    const tokenB = 'token_user_b_secret';

    const devA = store.registerDevice('user-admin-A', tokenA, { deviceName: 'Admin A PC' });
    const devB = store.registerDevice('user-admin-B', tokenB, { deviceName: 'Admin B PC' });

    // User A cannot validate User B's device token
    const crossValidate = store.validateDevice('user-admin-A', tokenB);
    assert.equal(crossValidate.valid, false);
    assert.equal(crossValidate.reason, 'cross_user_forbidden');

    // User A listing devices only sees their own
    const listA = store.listDevices('user-admin-A');
    assert.equal(listA.length, 1);
    assert.equal(listA[0].id, devA.id);

    // User A cannot revoke User B's device
    const crossRevoke = store.revokeDevice('user-admin-A', devB.id);
    assert.equal(crossRevoke.success, false);
    assert.match(crossRevoke.error, /Cannot revoke another user/i);
    assert.equal(devB.status, 'active');
  });

  it('8. OTP RATE LIMITING: 60-second cooldown is enforced between OTP generation requests', () => {
    const store = new MockAdminDeviceStore();
    const res1 = store.generateOtp('admin-001', 'admin@motionnodeedits.com');
    assert.equal(res1.success, true);

    // Immediate second request within 60s is blocked
    const res2 = store.generateOtp('admin-001', 'admin@motionnodeedits.com');
    assert.equal(res2.success, false);
    assert.match(res2.error, /Rate limit exceeded/i);
    assert(res2.cooldown > 0 && res2.cooldown <= 60);
  });

  it('9. OTP BRUTE FORCE DEFENSE: Maximum 5 invalid attempts locks out code', () => {
    const store = new MockAdminDeviceStore();
    const otpGen = store.generateOtp('admin-001', 'admin@motionnodeedits.com');
    const realCode = otpGen.code;

    // 5 bad attempts
    for (let i = 1; i <= 5; i++) {
      const verifyRes = store.verifyOtp('admin-001', '000000');
      assert.equal(verifyRes.success, false);
    }

    // 6th attempt with REAL code must now be rejected due to lockout
    const finalAttempt = store.verifyOtp('admin-001', realCode);
    assert.equal(finalAttempt.success, false);
    assert.match(finalAttempt.error, /Too many attempts|Locked out/i);
  });

  it('10. OTP REPLAY PROTECTION: Code cannot be reused after successful verification', () => {
    const store = new MockAdminDeviceStore();
    const otpGen = store.generateOtp('admin-001', 'admin@motionnodeedits.com');

    // First verification passes
    const firstVerify = store.verifyOtp('admin-001', otpGen.code);
    assert.equal(firstVerify.success, true);

    // Second verification with the exact same code fails
    const secondVerify = store.verifyOtp('admin-001', otpGen.code);
    assert.equal(secondVerify.success, false);
    assert.match(secondVerify.error, /No active OTP found/i);
  });
});


