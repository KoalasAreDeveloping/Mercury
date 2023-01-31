import { components } from "../Mercury.js";
import * as react from "react";
import React from "react";

let MercuryApp = components.MercuryApp

export class TestComponent extends react.Component {

    render() {

        return (
            <html>
                <head>

                    <title>Hello World!</title>

                </head>
                <body>
                    <MercuryApp>
                        <h1>Hello World!</h1>
                        <br />
                        <h4>This is a test</h4>
                    </MercuryApp>
                </body>
            </html>
        )

    }

}