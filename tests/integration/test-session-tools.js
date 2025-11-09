/**
 * Integration test for session management tools
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  getSessionStatus,
} from '../../src/tools/session-tools.js';

describe.skip('Session Tools Integration', () => {
  const testProjectFolder = 'test-session-project';

  beforeEach(async () => {
    // Clean up any existing sessions
    try {
      await getSessionStatus({ project_folder: testProjectFolder });
    } catch {
      // Ignore errors - no session to clean up
    }
  });

  it('should start a new session', async () => {
    const result = await startSession({
      project_folder: testProjectFolder,
      message: 'Test session',
    });

    const data = JSON.parse(result);
    expect(data.success).toBe(true);
    expect(data.session_id).toBeDefined();
    expect(data.project_folder).toBe(testProjectFolder);
    expect(data.status).toBe('active');
  });

  it('should get session status', async () => {
    // Start a session first
    await startSession({
      project_folder: testProjectFolder,
      message: 'Test session for status',
    });

    const result = await getSessionStatus({ project_folder: testProjectFolder });
    const data = JSON.parse(result);

    expect(data.success).toBe(true);
    expect(data.has_active_session).toBe(true);
    expect(data.session.status).toBe('active');
  });

  it('should pause and resume session', async () => {
    // Start a session
    const startResult = await startSession({
      project_folder: testProjectFolder,
      message: 'Test pause/resume',
    });
    const startData = JSON.parse(startResult);
    const sessionId = startData.session_id;

    // Pause the session
    const pauseResult = await pauseSession({ project_folder: testProjectFolder });
    const pauseData = JSON.parse(pauseResult);
    expect(pauseData.status).toBe('paused');

    // Resume the session
    const resumeResult = await resumeSession({
      project_folder: testProjectFolder,
      session_id: sessionId,
    });
    const resumeData = JSON.parse(resumeResult);
    expect(resumeData.status).toBe('active');
  });

  it('should complete session', async () => {
    // Start a session
    await startSession({
      project_folder: testProjectFolder,
      message: 'Test completion',
    });

    // Complete the session
    const result = await endSession({
      project_folder: testProjectFolder,
      message: 'Test completed',
    });

    const data = JSON.parse(result);
    expect(data.success).toBe(true);
    expect(data.summary).toBeDefined();

    // Verify no active session
    const statusResult = await getSessionStatus({ project_folder: testProjectFolder });
    const statusData = JSON.parse(statusResult);
    expect(statusData.has_active_session).toBe(false);
  });
});
