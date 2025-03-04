'use client';

import { memo } from 'react';

// Define the VisibilityType type if it's not imported
type VisibilityType = 'private' | 'public' | 'unlisted';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  return (
    <header className="flex sticky top-0 bg-white dark:bg-gray-900 py-2 items-center px-4 gap-2 border-b">
      {/* Sidebar toggle button */}
      <button 
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => {
          // This would normally toggle the sidebar
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {/* New chat button */}
      <button
        className="border rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => {
          // Use window.location instead of router
          window.location.href = '/';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 4V12M4 8H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="sr-only">New Chat</span>
      </button>

      {/* Model selector would go here */}
      {!isReadonly && (
        <div className="border rounded-md px-3 py-1 text-sm">
          {selectedModelId}
        </div>
      )}

      {/* Visibility selector would go here */}
      {!isReadonly && (
        <div className="border rounded-md px-3 py-1 text-sm">
          {selectedVisibilityType}
        </div>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
