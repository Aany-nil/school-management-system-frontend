import React from 'react'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<StepOne />} />
      </Routes>
   </BrowserRouter>

  )
}

export default App;
