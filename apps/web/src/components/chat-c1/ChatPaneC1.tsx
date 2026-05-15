import { ChatComposer } from '../ChatComposer';
import type { ChatPaneProps } from '../ChatPaneLegacy';
import { mapAgentEventsToC1Blocks, type C1ContentBlock } from '../../lib/c1-bridge/event-mapper';
import { commentsToAttachments } from '../../comments';
import { ArtifactChip } from './customComponents/ArtifactChip';
import { BashCard } from './customComponents/BashCard';
import { CLIBadge } from './customComponents/CLIBadge';
import { FileCard } from './customComponents/FileCard';
import { TodoWriteCard } from './customComponents/TodoWriteCard';

export function ChatPaneC1({
  messages,
  streaming,
  error,
  projectId,
  projectFiles,
  onEnsureProject,
  attachedComments = [],
  onDetachComment,
  onSend,
  onStop,
  initialDraft,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onOpenSettings,
  onOpenMcpSettings,
  petConfig,
  onAdoptPet,
  onTogglePet,
  onOpenPetSettings,
  projectMetadata,
  onProjectMetadataChange,
  researchAvailable,
  onCollapse,
}: ChatPaneProps) {
  return (
    <div className="pane" data-testid="chat-pane-c1">
      <div className="chat-header c1-chat-header">
        <div className="chat-header-tabs">
          <strong>C1 Chat</strong>
          <CLIBadge label="default" tone="success" />
        </div>
        <div className="chat-header-actions">
          {onNewConversation ? (
            <button type="button" className="icon-only" onClick={onNewConversation} aria-label="New conversation" title="New conversation">
              +
            </button>
          ) : null}
          {onOpenSettings ? (
            <button type="button" className="icon-only" onClick={onOpenSettings} aria-label="Settings" title="Settings">
              ⚙
            </button>
          ) : null}
          {onCollapse ? (
            <button type="button" className="icon-only" onClick={onCollapse} aria-label="Focus workspace" title="Focus workspace">
              ←
            </button>
          ) : null}
        </div>
      </div>

      {conversations.length > 0 ? (
        <div className="c1-conversation-strip">
          {conversations.slice(0, 8).map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`c1-conversation-chip${conversation.id === activeConversationId ? ' active' : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              {conversation.title || 'Untitled'}
            </button>
          ))}
        </div>
      ) : null}

      <div className="chat-log c1-chat-log">
        {messages.length === 0 ? (
          <div className="c1-empty-state">
            <CLIBadge label="C1 ready" tone="success" />
            <p>目前已切換為 C1 對話框，沿用既有 daemon / tool event 流程。</p>
          </div>
        ) : null}
        {messages.map((message) => {
          const blocks = message.role === 'assistant'
            ? mapAgentEventsToC1Blocks(message.events, streaming && message === messages[messages.length - 1])
            : [];
          const hasSeparateText = blocks.some((block) => block.type === 'text');
          return (
            <article key={message.id} className={`msg ${message.role === 'user' ? 'user' : 'assistant'} c1-msg`}>
              <div className="role">
                <span>{message.role === 'user' ? 'User' : message.agentName || 'C1'}</span>
                {message.runStatus ? <span className="msg-time">{message.runStatus}</span> : null}
              </div>
              {message.role === 'user' ? (
                <div className="user-text">{message.content}</div>
              ) : (
                <div className="c1-assistant-body">
                  {message.content && !hasSeparateText ? (
                    <div className="prose c1-prose">{message.content}</div>
                  ) : null}
                  {blocks.map((block, index) => (
                    <div key={`${message.id}-${index}`} className="c1-block">
                      <RenderC1Block block={block} />
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
        {error ? <div className="msg error">{error}</div> : null}
      </div>

      <ChatComposer
        projectId={projectId}
        projectFiles={projectFiles}
        streaming={streaming}
        initialDraft={initialDraft}
        onEnsureProject={onEnsureProject}
        commentAttachments={commentsToAttachments(attachedComments)}
        onRemoveCommentAttachment={onDetachComment}
        onSend={onSend}
        onStop={onStop}
        onOpenSettings={onOpenSettings}
        onOpenMcpSettings={onOpenMcpSettings}
        petConfig={petConfig}
        onAdoptPet={onAdoptPet}
        onTogglePet={onTogglePet}
        onOpenPetSettings={onOpenPetSettings}
        researchAvailable={researchAvailable}
        projectMetadata={projectMetadata}
        onProjectMetadataChange={onProjectMetadataChange}
      />
    </div>
  );
}

function RenderC1Block({ block }: { block: C1ContentBlock }) {
  if (block.type === 'text') return <div className="prose c1-prose">{block.text}</div>;
  if (block.type === 'thinking') return <div className="c1-thinking">{block.text}</div>;
  if (block.type === 'status') return <CLIBadge label={block.text} tone="neutral" />;
  if (block.type === 'raw') return <pre className="c1-result-block">{block.text}</pre>;
  if (block.component === 'TodoWriteCard') {
    return <TodoWriteCard items={toTodoItems(block.props.items)} status={toOptionalString(block.props.status)} resultText={toOptionalString(block.props.resultText)} isError={Boolean(block.props.isError)} />;
  }
  if (block.component === 'BashCard') {
    return <BashCard command={toOptionalString(block.props.command) ?? ''} description={toOptionalString(block.props.description)} status={toOptionalString(block.props.status)} output={toOptionalString(block.props.output)} isError={Boolean(block.props.isError)} />;
  }
  if (block.component === 'FileCard') {
    return <FileCard operation={toFileOperation(block.props.operation)} path={toOptionalString(block.props.path) ?? '(unnamed)'} summary={toOptionalString(block.props.summary)} status={toOptionalString(block.props.status)} resultText={toOptionalString(block.props.resultText)} isError={Boolean(block.props.isError)} />;
  }
  if (block.component === 'ArtifactChip') {
    return <ArtifactChip title={toOptionalString(block.props.title)} action={toOptionalString(block.props.action)} artifactId={toOptionalString(block.props.artifactId)} refreshStatus={toOptionalString(block.props.refreshStatus)} phase={toOptionalString(block.props.phase)} error={toOptionalString(block.props.error)} />;
  }
  return <CLIBadge label={toOptionalString(block.props.label) ?? block.component} tone={toBadgeTone(block.props.tone)} detail={toOptionalString(block.props.detail)} />;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toBadgeTone(value: unknown): 'neutral' | 'danger' | 'success' {
  return value === 'danger' || value === 'success' ? value : 'neutral';
}

function toFileOperation(value: unknown): 'write' | 'edit' | 'read' {
  return value === 'edit' || value === 'read' ? value : 'write';
}

function toTodoItems(value: unknown): Array<{ content: string; status: 'pending' | 'in_progress' | 'completed'; activeForm?: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    if (typeof record.content !== 'string' || !record.content) return [];
    return [{
      content: record.content,
      status:
        record.status === 'completed' || record.status === 'in_progress'
          ? record.status
          : 'pending',
      activeForm: typeof record.activeForm === 'string' ? record.activeForm : undefined,
    }];
  });
}
