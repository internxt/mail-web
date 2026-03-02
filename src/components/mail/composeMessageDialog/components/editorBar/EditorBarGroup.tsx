import type { EditorBarItem } from '../../types'
import { EditorBarButton } from './EditorBarButton'

export interface EditorBarGroupProps {
  items: EditorBarItem[]
  disabled?: boolean
}

export const EditorBarGroup = ({ items, disabled }: EditorBarGroupProps) => (
  <div className="flex flex-row items-center gap-2">
    {items.map((item) => (
      <EditorBarButton
        key={item.id}
        onClick={item.onClick}
        isActive={item.isActive}
        disabled={disabled}
      >
        <item.icon size={20} />
      </EditorBarButton>
    ))}
  </div>
)
