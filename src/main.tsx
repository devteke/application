import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { installAutoTitle } from './utils/autoTitle'

installAutoTitle()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
)