import * as React from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { Hero } from "../components/hero"
import { Usage } from "../components/usage"
import { Criteria } from "../components/criteria"

const IndexPage = () => (
  <Layout>
    <Seo title="Stethoscope" />
    <Hero />
    <Usage />
    <Criteria />
  </Layout>
)

export default IndexPage
