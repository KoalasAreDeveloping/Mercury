import React from "react"
import * as react from "react"

export class CookiePrompt extends react.Component {
    render() {
        return (
          <>
            <script src="/mercury/services/cookies" />
            <div className="mercury-cookieprompt-wrapper">
                <div className="mercury-cookieprompt">
                    <div className="mercury-center">
                        <h1>This site uses cookies!</h1>
                        <br />
                        <h3>What's a cookie?</h3>
                        <p>
                            Cookies are small peices of information stored by your browser.
                            Cookies allow websites to remember information from previous
                            visits, both useful for you (For example, login details or the
                            content of a shopping basket), and useful for the website (for
                            example, how many times you visit, or how long a visit lasts).
                        </p>
                        <br />
                        <div className="mercury-inline">
                            <button className="mercury-cookie-button" type="button" id="mercuryCookieAccept">Accept Cookies</button>
                            <button className="mercury-cookie-button" type="button" id="mercuryCookieReject">Reject Cookies</button>
                        </div>
                    </div>
                </div>
            </div>
          </>
        )
    }
}