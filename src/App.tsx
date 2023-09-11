import React, { useEffect, useState } from "react"
import "./App.css"

const PROXY_SERVER = "https://shcors.uwu.network"
const STATUSES_REFRESH_INTERVAL = 60

type Statuses = {
	[key: number]: {
		code: number
		message: string
	}
}

let statuses: Statuses = await get_statuses()

setInterval(() => {
	get_statuses()
		.then((result) => (statuses = result))
		.catch(console.error)
}, STATUSES_REFRESH_INTERVAL * 1000)

/**
 * A custom `fetch` function to access webpages through a CORS proxy
 * @param {string} input The URL to fetch
 * @param init {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters Various options} to pass to the `fetch` function
 */
function cors_fetch(input: string, init?: RequestInit): Promise<Response> {
	return new Promise((resolve, reject) => {
		fetch(`${PROXY_SERVER}/${input}`, { ...init, mode: "cors" })
			.then(async (response) => {
				// Check whether or not the domain accessed exists
				if (
					response.status === 530 &&
					(await response.text()) === "error code: 1016"
				) {
					alert("Domain doesn't exist")
					reject("CORS Fetch: Domain doesn't exist")
				} else {
					resolve(response)
				}
			})
			.catch(reject)
	})
}

async function get_statuses(): Promise<Statuses> {
	// eslint-disable-next-line no-eval
	return eval(
		await (
			await fetch(
				"https://raw.githubusercontent.com/httpcats/http.cat/master/lib/statuses.js"
			)
		).text()
	)
}

function isValidHttpCode(status_code: number): boolean {
	return status_code in statuses
}

function App() {
	console.log(statuses)
	const [statusCode, setStatusCode] = useState<number>()
	const [statusValid, setStatusValid] = useState<boolean>()

	const [inputURL, setInputURL] = useState<string>()

	useEffect(() => {
		if (statusCode !== undefined) {
			setStatusValid(isValidHttpCode(statusCode))
		}
	}, [statusCode])

	return (
		<main>
			{statusValid !== undefined && statusCode !== undefined && (
				<>
					{statusValid
						? `Status code "${statusCode}" is valid`
						: "Invalid status code detected"}
					<br />
				</>
			)}
			<input value={inputURL} onChange={(e) => setInputURL(e.target.value)} />
			<button
				onClick={() => {
					if (typeof inputURL !== "undefined")
						cors_fetch(inputURL)
							.then((response) => {
								setStatusCode(response.status)
							})
							.catch(console.error)
				}}>
				Submit URL
			</button>
		</main>
	)
}

export default App
