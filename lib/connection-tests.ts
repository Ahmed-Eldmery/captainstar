/**
 * =====================
 * CONNECTION TEST UTILITY
 * =====================
 * 
 * استخدم هذا الملف للتحقق من اتصال قاعدة البيانات
 */

import database from './database';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = performance.now();
  try {
    await testFn();
    const duration = performance.now() - startTime;
    results.push({
      name,
      status: 'PASS',
      message: '✅ Test passed',
      duration: Math.round(duration)
    });
    console.log(`✅ ${name} (${Math.round(duration)}ms)`);
  } catch (error) {
    const duration = performance.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      status: 'FAIL',
      message: `❌ ${message}`,
      duration: Math.round(duration)
    });
    console.error(`❌ ${name}: ${message} (${Math.round(duration)}ms)`);
  }
}

export async function testDatabaseConnection() {
  console.log('🔍 Starting database connection tests...\n');

  // Test 1: Users
  await runTest('GET All Users', async () => {
    const users = await database.users.getAll();
    if (!Array.isArray(users)) throw new Error('Invalid response');
  });

  // Test 2: Clients
  await runTest('GET All Clients', async () => {
    const clients = await database.clients.getAll();
    if (!Array.isArray(clients)) throw new Error('Invalid response');
  });

  // Test 3: Projects
  await runTest('GET All Projects', async () => {
    const projects = await database.projects.getAll();
    if (!Array.isArray(projects)) throw new Error('Invalid response');
  });

  // Test 4: Tasks
  await runTest('GET All Tasks', async () => {
    const tasks = await database.tasks.getAll();
    if (!Array.isArray(tasks)) throw new Error('Invalid response');
  });

  // Test 5: Batch getAllData
  await runTest('Batch GET All Data', async () => {
    const data = await database.batch.getAllData();
    if (!data.users || !data.clients || !data.projects || !data.tasks) {
      throw new Error('Missing required data in batch response');
    }
  });

  // Test 6: Community Posts
  await runTest('GET All Community Posts', async () => {
    const posts = await database.posts.getAll();
    if (!Array.isArray(posts)) throw new Error('Invalid response');
  });

  // Test 7: Approvals
  await runTest('GET All Approvals', async () => {
    const approvals = await database.approvals.getAll();
    if (!Array.isArray(approvals)) throw new Error('Invalid response');
  });

  // Test 8: Performance
  await runTest('GET All Performance Data', async () => {
    const perf = await database.performance.getAll();
    if (!Array.isArray(perf)) throw new Error('Invalid response');
  });

  // Test 9: Activity Logs
  await runTest('GET All Activity Logs', async () => {
    const logs = await database.activity.getAll();
    if (!Array.isArray(logs)) throw new Error('Invalid response');
  });

  // Test 10: Files
  await runTest('GET All Files', async () => {
    const files = await database.files.getAll();
    if (!Array.isArray(files)) throw new Error('Invalid response');
  });

  // Test 11: Client Accounts
  await runTest('GET All Client Accounts', async () => {
    const accounts = await database.accounts.getAll();
    if (!Array.isArray(accounts)) throw new Error('Invalid response');
  });

  // Test 12: Create Client (if no clients exist)
  await runTest('CREATE Client', async () => {
    const testClient = await database.clients.create({
      id: `test_client_${Date.now()}`,
      name: 'Test Client',
      industry: 'Testing',
      country: 'Test Country',
      postsQuota: 10,
      createdAt: new Date().toISOString()
    });
    if (!testClient.id) throw new Error('Failed to create client');
    // Cleanup
    await database.clients.delete(testClient.id).catch(() => {});
  });

  // Test 13: Create Project
  await runTest('CREATE Project', async () => {
    const clients = await database.clients.getAll();
    if (clients.length === 0) throw new Error('No clients available');
    
    const testProject = await database.projects.create({
      id: `test_project_${Date.now()}`,
      clientId: clients[0].id,
      name: 'Test Project',
      status: 'قيد التنفيذ' as any,
      createdByUserId: 'test_user',
      createdAt: new Date().toISOString()
    });
    if (!testProject.id) throw new Error('Failed to create project');
    // Cleanup
    await database.projects.delete(testProject.id).catch(() => {});
  });

  // Test 14: Create Task
  await runTest('CREATE Task', async () => {
    const clients = await database.clients.getAll();
    if (clients.length === 0) throw new Error('No clients available');
    
    const testTask = await database.tasks.create({
      id: `test_task_${Date.now()}`,
      clientId: clients[0].id,
      title: 'Test Task',
      status: 'للتنفيذ' as any,
      priority: 'متوسطة' as any,
      type: 'محتوى' as any,
      createdByUserId: 'test_user',
      createdAt: new Date().toISOString()
    });
    if (!testTask.id) throw new Error('Failed to create task');
    // Cleanup
    await database.tasks.delete(testTask.id).catch(() => {});
  });

  // Test 15: Update Task
  await runTest('UPDATE Task Status', async () => {
    const tasks = await database.tasks.getAll();
    if (tasks.length === 0) throw new Error('No tasks available');
    
    const updated = await database.tasks.updateStatus(tasks[0].id, 'قيد العمل' as any);
    if (updated.status !== 'قيد العمل') throw new Error('Failed to update status');
  });

  // Test 16: Create Post
  await runTest('CREATE Community Post', async () => {
    const users = await database.users.getAll();
    if (users.length === 0) throw new Error('No users available');
    
    const testPost = await database.posts.create({
      id: `test_post_${Date.now()}`,
      userId: users[0].id,
      department: 'testing',
      content: 'Test post content',
      type: 'discussion',
      createdAt: new Date().toISOString()
    });
    if (!testPost.id) throw new Error('Failed to create post');
    // Cleanup
    await database.posts.delete(testPost.id).catch(() => {});
  });

  // Test 17: Activity Log
  await runTest('LOG Activity', async () => {
    const users = await database.users.getAll();
    if (users.length === 0) throw new Error('No users available');
    
    await database.activity.logAction(
      users[0].id,
      'test_action',
      'Test',
      'test_id'
    );
  });

  // Test 18: Search Clients
  await runTest('SEARCH Clients', async () => {
    const clients = await database.clients.getAll();
    if (clients.length > 0) {
      const searchResults = await database.clients.search(clients[0].name);
      if (!Array.isArray(searchResults)) throw new Error('Invalid search response');
    }
  });

  // Test 19: Filter Tasks by Status
  await runTest('FILTER Tasks by Status', async () => {
    const filtered = await database.tasks.getByStatus('TODO');
    if (!Array.isArray(filtered)) throw new Error('Invalid filter response');
  });

  // Test 20: Get Pending Approvals
  await runTest('GET Pending Approvals', async () => {
    const pending = await database.approvals.getPending();
    if (!Array.isArray(pending)) throw new Error('Invalid response');
  });

  // Print Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n✅ PASSED: ${passed}/${total}`);
  console.log(`❌ FAILED: ${failed}/${total}`);
  console.log(`⏱️  TOTAL TIME: ${totalTime}ms\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.message}`);
      });
  }

  console.log('\nDETAILED RESULTS:');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${r.name.padEnd(30)} ${r.duration}ms`);
  });

  console.log('\n' + '='.repeat(60));

  return {
    passed,
    failed,
    total,
    totalTime,
    results
  };
}

// Export for use in tests or App.tsx
export async function performHealthCheck(): Promise<boolean> {
  try {
    const data = await database.batch.getAllData();
    console.log('✅ Database health check passed');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Easy test function to call from console
export async function testConnection() {
  console.clear();
  return await testDatabaseConnection();
}

// Export default
export default {
  testDatabaseConnection,
  performHealthCheck,
  testConnection
};

/**
 * USAGE:
 * 
 * في App.tsx أو أي مكان:
 * 
 * import connectionTests from './lib/connection-tests';
 * 
 * useEffect(() => {
 *   connectionTests.performHealthCheck();
 * }, []);
 * 
 * أو في الـ console:
 * 
 * import('./lib/connection-tests').then(m => m.testConnection());
 */
