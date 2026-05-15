import { getChatUIMode } from '../lib/feature-flags';
import { ChatPaneC1 } from './chat-c1/ChatPaneC1';
import { ChatPaneLegacy, type ChatPaneProps } from './ChatPaneLegacy';

export type { ChatPaneProps } from './ChatPaneLegacy';

export function ChatPane(props: ChatPaneProps) {
  return getChatUIMode() === 'c1'
    ? <ChatPaneC1 {...props} />
    : <ChatPaneLegacy {...props} />;
}
