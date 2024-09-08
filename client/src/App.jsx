import './App.css'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Settings from './components/Settings';
import { Container } from '@chakra-ui/react'
import { Menu } from './components/Menu';

function App() {
  const theme = extendTheme({ 
    initialColorMode: 'dark',
    useSystemColorMode: false,
   })

  return (
    <>
        <ChakraProvider theme={theme}>
    <Router>
      <Container>
      <div>
        <Menu></Menu>

        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
        </Container>
    </Router>
    </ChakraProvider>
    </>
  )
}

export default App
