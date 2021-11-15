import * as React from "react"
import { useState } from "react"
import { StaticImage } from "gatsby-plugin-image"

export function Downloads() {
  return (
    <div className="flex justify-center">
      <a
        href="https://chrome.google.com/webstore/detail/stethoscope/gdkkpjagibimlpgmcbaajccgahfbojec"
        className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 mr-4 focus:outline-none hover:bg-indigo-600 rounded text-lg justify-center items-center"
      >
        <StaticImage
          src="../images/browser-icon-chrome.png"
          alt="Chrome icon"
          className="h-5 w-5 mr-2"
          placeholder="blurred"
        />
        <span>Chrome</span>
      </a>

      <a
        href="https://addons.mozilla.org/en-US/firefox/addon/stethoscope/"
        className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 mr-4 focus:outline-none hover:bg-indigo-600 rounded text-lg justify-center items-center"
      >
        <StaticImage
          src="../images/browser-icon-firefox.png"
          alt="Firefox icon"
          className="h-8 w-8"
          placeholder="blurred"
        />
        <span>Firefox</span>
      </a>

      <a
        href=""
        className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 mr-4 focus:outline-none hover:bg-indigo-600 rounded text-lg justify-center items-center"
      >
        <StaticImage
          src="../images/browser-icon-opera.png"
          alt="Opera icon"
          className="h-5 w-5 mr-2"
          placeholder="blurred"
        />
        <span>Opera</span>
      </a>
    </div>
  )
}
