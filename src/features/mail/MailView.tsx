import { useNavigation } from '@/hooks/useNavigation'
import { PATHS } from '@/routes/paths'

interface MailViewProps {
  folder: string
}

const MailView = ({ folder }: MailViewProps) => {
  const { goTo } = useNavigation()

  const goToInbox = () => {
    goTo(PATHS.inbox)
  }

  const goToTrash = () => {
    goTo(PATHS.trash)
  }

  return (
    <div>
      <p>Current folder: {folder}</p>
      <div className="flex flex-row gap-2">
        <button onClick={goToInbox}>Go To Inbox</button>
        <button onClick={goToTrash}>Go To Trash</button>
      </div>
    </div>
  )
}

export default MailView
