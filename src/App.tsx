import { Suspense } from 'react'
import './App.css'
import { AppRoutes } from './routes'

function App() {
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<p>Loading...</p>}>
          <AppRoutes />
        </Suspense>
      </div>
    </div>
  )
}

export default App
