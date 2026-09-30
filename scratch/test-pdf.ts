import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from "@react-pdf/renderer";

// Bypass problematic hyphenation dynamic import
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  title: { fontSize: 18, marginBottom: 10 },
});

const MyDoc = () => (
  React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(View, null,
        React.createElement(Text, { style: styles.title }, "VELAASH TRADER'S - Invoice Test")
      )
    )
  )
);

async function test() {
  console.log("Rendering test PDF with Font.registerHyphenationCallback...");
  const buf = await renderToBuffer(React.createElement(MyDoc));
  console.log("PDF rendered successfully! Buffer byte length:", buf.length);
}

test().catch(console.error);
