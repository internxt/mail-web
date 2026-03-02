import type { RoutePath } from '@/routes/paths'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

export function useNavigation() {
  const navigate = useNavigate()
  const params = useParams()
  const location = useLocation()

  return {
    goTo: (path: RoutePath) => navigate(path),
    goBack: () => navigate(-1),
    currentPath: location.pathname,
    params,
  }
}
