/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
// import "./layout.css"

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <div>
      <main>{children}</main>
      <footer className="text-gray-600 body-font">
        <div className="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col justify-center">
          <a className="flex title-font font-medium items-center md:justify-start justify-center text-gray-900">
            <StaticImage
              className="w-10 h-10"
              alt="hero"
              src="../images/openmoji_stethoscope.png"
              placeholder="tracedSVG"
            />
            <h3 className="inline text-xl">Stethoscope</h3>
          </a>
          <p className="text-sm text-gray-500 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 sm:py-2 sm:mt-0 mt-4 mb-0">
            © {new Date().getFullYear()} Chris Griffing —
            <a
              href="https://twitter.com/cmgriffing"
              className="text-gray-600 ml-1"
              rel="noopener noreferrer"
              target="_blank"
            >
              @cmgriffing
            </a>
          </p>
          <span className="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
            <a
              className="text-gray-500"
              href="https://github.com/cmgriffing/stethoscope"
            >
              <StaticImage
                className="w-6 h-6"
                alt="hero"
                src="../images/github-mark.png"
                placeholder="tracedSVG"
              />
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
