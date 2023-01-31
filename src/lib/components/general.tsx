import React from "react"

import { CookiePrompt } from "./cookies.js"


export class MercuryApp extends React.Component<any> {
    render() {

        return (
            
            <>
                <link rel="stylesheet" href="/mercury/assets/css" />
                <div className="mercury-container">

                    {
                        this.props.children
                    }

                </div>
                <CookiePrompt />
            </>

        )
    }

}