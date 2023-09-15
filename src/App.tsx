import React, { useEffect, useState } from "react"
import "./App.css"

import isUrl from "validator/lib/isURL"

const PROXY_SERVER = "https://shcors.uwu.network"
const PLACEHOLDER_URL = "https://example.com"
const STATUSES_REFRESH_INTERVAL = 60
const DEFAULT_TIMEOUT = 5

let status_404: ArrayBuffer = await get_404()

setInterval(() => {
	get_404()
		.then((result) => (status_404 = result))
		.catch(console.error)
}, STATUSES_REFRESH_INTERVAL * 1000)

async function timeout_fetch(
	input: string,
	init?: RequestInit & { timeout?: number }
): Promise<Response> {
	let timeout = init?.timeout || DEFAULT_TIMEOUT
	init?.timeout !== undefined && delete init.timeout

	return await fetch(input, {
		...init,
		signal: AbortSignal.timeout(timeout * 1000),
	})
}

/**
 * A custom `fetch` function to access webpages through a CORS proxy
 * @param {string} input The URL to fetch
 * @param init {@link https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters Various options} to pass to the `fetch` function
 */
function cors_fetch(input: string, init?: RequestInit): Promise<Response> {
	return new Promise((resolve, reject) => {
		timeout_fetch(`${PROXY_SERVER}/${input}`, { ...init, mode: "cors" })
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

async function get_404(): Promise<ArrayBuffer> {
	// eslint-disable-next-line no-eval
	return await (await cors_fetch("https://http.cat/404")).arrayBuffer()
}

async function isValidHttpCode(status_code: number): Promise<boolean> {
	return (
		(await (
			await cors_fetch(`https://http.cat/${status_code}`)
		).arrayBuffer()) !== status_404
	)
}

function App() {
	const [statusCode, setStatusCode] = useState<number>()
	const [statusValid, setStatusValid] = useState<boolean>()

	const [inputURL, setInputURL] = useState<string>("")

	useEffect(() => {
		if (statusCode !== undefined) {
			isValidHttpCode(statusCode).then(setStatusValid).catch(console.error)
		}
	}, [statusCode])

	return (
		<main id="container">
			{statusValid !== undefined && statusCode !== undefined && (
				<>
					{statusValid ? (
						<img
							src={`https://http.cat/${statusCode}`}
							alt={`Status code "${statusCode}" is valid`}
						/>
					) : (
						"Invalid status code detected"
					)}
					<br />
				</>
			)}
			<form
				name="mainForm"
				id="mainForm"
				autoComplete="false"
				onSubmit={(e) => {
					// Prevent URL redirection after form submission
					e.preventDefault()

					let localInputURL = inputURL || PLACEHOLDER_URL

					if (isUrl(localInputURL, { require_protocol: true })) {
						// This URL validity check might seem redundant.
						// However, the browser URL validation might fail in some cases (http://.com for example),
						// so it is best to keep this check in here just in case
						cors_fetch(localInputURL)
							.then((response) => {
								setStatusCode(response.status)
							})
							.catch(console.error)
					} else {
						alert("Invalid URL inputted")
					}
				}}>
				<input
					name="inputUrl"
					id="inputUrl"
					type="url"
					autoComplete="off"
					placeholder={PLACEHOLDER_URL}
					value={inputURL}
					onChange={(e) => setInputURL(e.target.value)}
				/>
				<input
					name="submitButton"
					id="submitButton"
					type="submit"
					value="Submit URL"
				/>
			</form>
		</main>
	)
}

export default App
