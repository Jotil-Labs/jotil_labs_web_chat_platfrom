import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted, so we define the mock factory inline
vi.mock('./supabase', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
    },
  };
});

// Import after mock
import { supabase } from './supabase';
import {
  getActiveClient,
  saveMessage,
  incrementUsage,
  setFeedback,
} from './queries';

// Typed references to mock functions
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

function createChain() {
  const mockSingle = vi.fn();
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }));
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = mockSingle;
  return { chain, mockSingle };
}

describe('queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveClient', () => {
    it('returns client when active', async () => {
      const mockClient = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test',
        active: true,
      };
      const { chain, mockSingle } = createChain();
      mockFrom.mockReturnValue(chain);
      mockSingle.mockResolvedValue({ data: mockClient, error: null });

      const result = await getActiveClient(
        '00000000-0000-0000-0000-000000000001'
      );
      expect(result).toEqual(mockClient);
      expect(mockFrom).toHaveBeenCalledWith('clients');
    });

    it('returns null when client not found', async () => {
      const { chain, mockSingle } = createChain();
      mockFrom.mockReturnValue(chain);
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const result = await getActiveClient('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('saveMessage', () => {
    it('inserts a message', async () => {
      const mockMessage = {
        id: 'msg-1',
        conversation_id: 'conv-1',
        role: 'user',
        content: 'Hello',
      };

      const { chain } = createChain();
      const insertSingle = vi.fn().mockResolvedValue({ data: mockMessage, error: null });
      chain.insert = vi.fn(() => ({
        select: vi.fn(() => ({ single: insertSingle })),
      }));
      mockFrom.mockReturnValue(chain);

      const result = await saveMessage({
        conversationId: 'conv-1',
        role: 'user',
        content: 'Hello',
      });
      expect(result).toEqual(mockMessage);
    });
  });

  describe('incrementUsage', () => {
    it('calls rpc to increment', async () => {
      mockRpc.mockResolvedValue({ error: null });

      await incrementUsage('00000000-0000-0000-0000-000000000001');
      expect(mockRpc).toHaveBeenCalledWith('increment_messages_used', {
        client_id_param: '00000000-0000-0000-0000-000000000001',
      });
    });

    it('falls back to read-then-write on rpc error', async () => {
      mockRpc.mockResolvedValue({ error: { message: 'RPC not found' } });
      const { chain, mockSingle } = createChain();
      mockFrom.mockReturnValue(chain);
      mockSingle.mockResolvedValue({ data: { messages_used: 42 }, error: null });

      await incrementUsage('00000000-0000-0000-0000-000000000001');
      expect(mockFrom).toHaveBeenCalledWith('clients');
    });
  });

  describe('setFeedback', () => {
    it('updates feedback on a message', async () => {
      const { chain } = createChain();
      chain.eq = vi.fn(() => ({ error: null }));
      chain.update = vi.fn(() => chain);
      mockFrom.mockReturnValue(chain);

      await setFeedback('msg-1', 'positive');
      expect(mockFrom).toHaveBeenCalledWith('messages');
    });
  });
});
