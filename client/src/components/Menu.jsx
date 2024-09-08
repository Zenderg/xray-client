import { Link } from "@chakra-ui/react";
import { Link as ReactRouterLink } from 'react-router-dom'
import { Link as ChakraLink } from '@chakra-ui/react'

import './Menu.css'

export function Menu() {
    return (
        <>
        <div className="menu">
            <ChakraLink as={ReactRouterLink} to='/'>
            Home
            </ChakraLink>
            <ChakraLink as={ReactRouterLink} to='/settings'>
            Settings
            </ChakraLink>
        </div>
        </>
    )
}