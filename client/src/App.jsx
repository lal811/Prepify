import { RouterProvider } from 'react-router' 
import { router } from './app.routes.jsx'
import { AuthProvider } from './features/auth/auth.context.jsx'
import { InterviewProvider } from './features/interview/interview.context.jsx'

/**
 * App Layout Structure:
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━
 * │      <Header />         │  (Persistent across all pages)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━
 * │                         │
 * │   Route Pages Here      │  (Home, Interview, Login, Register)
 * │   (via RouterProvider)  │
 * │                         │
 * ━━━━━━━━━━━━━━━━━━━━━━━━━
 */

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  )
}

export default App
     