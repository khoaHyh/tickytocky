import { readFile } from "node:fs/promises"

import { describe, expect, test } from "vitest"
import { parseDocument } from "yaml"

describe("Cloudflare Pages workflow", () => {
  test("deploys only a verified main build", async () => {
    const source = await readFile(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8")
    const document = parseDocument(source, { uniqueKeys: true })
    const workflow: unknown = document.toJS()

    expect(document.errors).toEqual([])
    expect(workflow).toEqual({
      name: "Verify and deploy",
      on: {
        pull_request: null,
        push: { branches: ["main"] },
        workflow_dispatch: null,
      },
      permissions: { contents: "read" },
      concurrency: {
        group: "pages-${{ github.ref }}",
        "cancel-in-progress": true,
      },
      jobs: {
        site: {
          name: "Verify site",
          "runs-on": "ubuntu-latest",
          "timeout-minutes": 20,
          steps: [
            {
              name: "Check out repository",
              uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
            },
            {
              name: "Install pnpm",
              uses: "pnpm/action-setup@0ebf47130e4866e96fce0953f49152a61190b271",
              with: { version: "11.13.1" },
            },
            {
              name: "Install Node.js",
              uses: "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
              with: {
                "node-version-file": ".node-version",
                cache: "pnpm",
                "cache-dependency-path": "pnpm-lock.yaml",
              },
            },
            { name: "Install dependencies", run: "pnpm install --frozen-lockfile" },
            { name: "Install browsers", run: "pnpm exec playwright install --with-deps chromium webkit" },
            { name: "Verify site", run: "pnpm check" },
            { name: "Run browser tests", run: "pnpm test:e2e" },
            {
              name: "Deploy to Cloudflare Pages",
              if: "github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')",
              env: {
                CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}",
                CLOUDFLARE_ACCOUNT_ID: "${{ vars.CLOUDFLARE_ACCOUNT_ID }}",
                CLOUDFLARE_PAGES_PROJECT: "${{ vars.CLOUDFLARE_PAGES_PROJECT }}",
              },
              run:
                'deployment_output="$(\n' +
                "  pnpm exec wrangler pages deploy dist \\\n" +
                '    --project-name="$CLOUDFLARE_PAGES_PROJECT" \\\n' +
                "    --branch=main \\\n" +
                '    --commit-hash="$GITHUB_SHA"\n' +
                ')"\n' +
                "printf '%s\\n' \"$deployment_output\"\n" +
                "{\n" +
                "  printf '### Cloudflare Pages deployment\\n\\n'\n" +
                "  printf '```text\\n%s\\n```\\n' \"$deployment_output\"\n" +
                '} >> "$GITHUB_STEP_SUMMARY"\n',
            },
          ],
        },
      },
    })
  })
})
