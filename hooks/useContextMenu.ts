import React, { useCallback } from 'react';
import { useContextMenuContext } from '../contexts/ContextMenuContext';
import { ContextMenuItem } from '../types';

export const useContextMenu = () => {
  const { openMenu } = useContextMenuContext();

  const handleContextMenu = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    openMenu(e, items);
  }, [openMenu]);

  return { handleContextMenu };
};