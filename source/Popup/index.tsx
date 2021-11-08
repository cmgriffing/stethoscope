import * as React from "react";
import ReactDOM from "react-dom";
import { ChakraProvider } from "@chakra-ui/react";

import Popup from "./Popup";

ReactDOM.render(
  <ChakraProvider>
    <Popup />
  </ChakraProvider>,
  document.getElementById("popup-root")
);
