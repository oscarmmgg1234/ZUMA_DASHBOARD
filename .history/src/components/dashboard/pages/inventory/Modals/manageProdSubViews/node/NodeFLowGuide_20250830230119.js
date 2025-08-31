// NodeFlowGuide.jsx
import React from "react";

/**
 * Props:
 * - isLinked: boolean  → is this product linked to a virtual stock pool?
 * - route: "activation" | "reduction" | "shipment"  → current node view (optional)
 * - productName?: string
 */
export default function NodeFlowGuide({ isLinked, route, productName }) {
  return (
    <div className="mt-6 text-sm leading-6">
      {/* Heads-up banner */}
      <div
        className={`rounded-lg border p-4 mb-4 ${
          isLinked ? "bg-blue-50 border-blue-600" : "bg-gray-50 border-gray-300"
        }`}
      >
        <div className="font-semibold text-black mb-1">
          Heads up{productName ? ` for ${productName}` : ""}:
        </div>
        {isLinked ? (
          <p className="text-black">
            This product is <strong>linked to a virtual stock pool</strong>.
            <br />
            <span className="underline">What this means for you:</span>{" "}
            <strong>activate products and apply receipts</strong> as usual, but{" "}
            <strong>don’t manually change Stored stock</strong>. The pool keeps
            Stored in sync for you.
          </p>
        ) : (
          <p className="text-black">
            This product is <strong>not linked</strong> to a pool. You can use
            activation, reduction, and direct stock updates as needed.
          </p>
        )}
      </div>

      {/* Glossary */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">Quick glossary</h3>
        <div className="grid gap-2">
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Stored</strong> — inventory that’s “in the garage,” not yet
            ready for pick-pack. (Back room / warehouse)
          </div>
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Active</strong> — inventory that’s “on the shelf,” ready to
            fulfill/dispense. Activation moves items from Stored → Active.
          </div>
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Program (Tokens)</strong> — a space-separated list of steps:
            <br />
            <code className="bg-gray-900 text-white px-2 py-1 rounded">
              CLASS:FUNC:PRODUCT_ID[:param1][:param2][:param3]
            </code>
          </div>
        </div>
      </section>

      {/* Lanes */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">Lanes you’ll see</h3>
        <ul className="list-disc ml-5 text-black">
          <li>
            <strong>AC</strong> – Activation (move Stored → Active)
          </li>
          <li>
            <strong>RD</strong> – Reduction/Consumption (use product)
          </li>
          <li>
            <strong>UP</strong> – Direct stock updates (add/subtract)
          </li>
          <li>
            <strong>SH</strong> – Shipments (incoming)
          </li>
          <li>
            <strong>VIRTUALOPS</strong> – Pool logic (auto-sync Stored for
            linked products)
          </li>
          <li>
            <strong>PREOPS/POSTOPS</strong> – Before/after helpers (logging,
            normalization)
          </li>
          <li>
            <strong>CM / CMUP</strong> – <em>Receipt (v2)</em> macros: write a{" "}
            record and do the matching stock move in one go. These are the
            preferred, modern steps because they’re easy to revert.
          </li>
        </ul>
      </section>

      {/* Why receipts matter + Reversion */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">
          Why “receipt (v2)” updates matter — and how revert works
        </h3>
        <div className="rounded border border-green-600 bg-green-50 p-3 text-black mb-3">
          <p className="mb-2">
            A <strong>receipt</strong> is a small, clear record of what
            happened, saved alongside the stock change. Think of it as the
            “paper trail” for a step (who did it, what product, how many, when).
          </p>
          <ul className="list-disc ml-5">
            <li>
              <strong>Reversion needs receipts.</strong> If something goes
              wrong, the system can read the receipt and apply the{" "}
              <em>exact inverse</em> change safely (undo).
            </li>
            <li>
              <strong>Audits are easy.</strong> Receipts show what was done and
              why. You can see a full timeline for a transaction.
            </li>
            <li>
              <strong>No double-counting.</strong> Because the record and the
              stock movement are tied together, we avoid mismatches.
            </li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded border border-gray-300 bg-white/70 p-3">
            <div className="font-semibold">Example: Receipt (v2) Reduction</div>
            <p>
              You use{" "}
              <code className="bg-gray-900 text-white px-1 rounded">
                CM:2j2k:&lt;productID&gt;
              </code>{" "}
              (store a reduction record + subtract Stored).
            </p>
            <p className="mt-2">
              If you need to undo later, the system reads that receipt and adds
              the same qty back to Stored (and clears the record). Clean, exact
              reversal.
            </p>
          </div>
          <div className="rounded border border-gray-300 bg-white/70 p-3">
            <div className="font-semibold">Example: Activation</div>
            <p>
              You activate with{" "}
              <code className="bg-gray-900 text-white px-1 rounded">
                AC:290W:&lt;productID&gt;
              </code>{" "}
              (write activation record + move into Active).
            </p>
            <p className="mt-2">
              A revert applies the opposite move and cancels the record. If the
              product is linked to a pool, Stored is re-synced by the pool logic
              automatically.
            </p>
          </div>
        </div>

        <div className="rounded border border-blue-300 bg-blue-50 p-3 text-black mt-3">
          <div className="font-semibold">When using Pools</div>
          <ul className="list-disc ml-5">
            <li>
              Keep using receipts (v2). They still give you clean undo and a
              clear history.
            </li>
            <li>
              Don’t add manual{" "}
              <code className="bg-gray-900 text-white px-1 rounded">UP:*</code>{" "}
              steps for Stored on linked products —{" "}
              <strong>the pool handles Stored</strong>.
            </li>
          </ul>
        </div>
      </section>

      {/* How programs run */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">How programs run</h3>
        <ol className="list-decimal ml-5 text-black">
          <li>
            The engine reads your tokens <strong>left → right</strong>.
          </li>
          <li>
            Many functions are <strong>macros</strong> (they do multiple safe
            steps in the right order).
          </li>
          <li>
            Good rule: <strong>PREOPS first</strong>, your main steps in the
            middle, <strong>POSTOPS last</strong>. If you use pools, put{" "}
            <code className="bg-gray-900 text-white px-1 rounded">
              VIRTUALOPS:4i57
            </code>{" "}
            after reductions/activations to sync Stored.
          </li>
        </ol>
      </section>

      {/* Common recipes */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">Common recipes</h3>

        <div className="rounded border border-gray-300 p-3 bg-white/60 mb-3">
          <div className="font-semibold text-black">Activate (standalone)</div>
          <p className="text-black">
            Move items from Stored → Active. Also writes an activation record.
          </p>
          <code className="block bg-gray-900 text-white px-2 py-1 rounded mt-2">
            AC:290W:&lt;productID&gt;
          </code>
        </div>

        <div className="rounded border border-gray-300 p-3 bg-white/60 mb-3">
          <div className="font-semibold text-black">
            Capsule reduction with ratio (v2 receipt)
          </div>
          <p className="text-black">
            Writes a reduction record and subtracts <em>ratio × quantity</em>{" "}
            from Stored in one go.
          </p>
          <code className="block bg-gray-900 text-white px-2 py-1 rounded mt-2">
            RD:29wp:&lt;productID&gt;:&lt;pillRatio&gt;
          </code>
        </div>

        <div className="rounded border border-blue-300 p-3 bg-blue-50 mb-3">
          <div className="font-semibold text-black">
            If the product is linked to a pool
          </div>
          <p className="text-black">
            Don’t add manual Stored updates. Let the pool normalize:
          </p>
          <code className="block bg-gray-900 text-white px-2 py-1 rounded mt-2">
            VIRTUALOPS:4i57:&lt;productID&gt;:&lt;poolID&gt;
          </code>
          <p className="text-black mt-2">
            Tip: place this after your reductions or activations.
          </p>
        </div>

        <div className="rounded border border-gray-300 p-3 bg-white/60 mb-3">
          <div className="font-semibold text-black">
            Shipment (record + add)
          </div>
          <p className="text-black">
            Writes a shipment record and adds Stored.
          </p>
          <code className="block bg-gray-900 text-white px-2 py-1 rounded mt-2">
            SH:23ij:&lt;productID&gt;
          </code>
        </div>

        <div className="rounded border border-gray-300 p-3 bg-white/60 mb-3">
          <div className="font-semibold text-black">
            Receipt (v2): record + subtract Stored
          </div>
          <p className="text-black">
            Gives you a proper “receipt” trail and the matching stock move in
            one token — best for clean reverts.
          </p>
          <code className="block bg-gray-900 text-white px-2 py-1 rounded mt-2">
            CM:2j2k:&lt;productID&gt;
          </code>
        </div>

        <div className="rounded border border-orange-300 p-3 bg-orange-50">
          <div className="font-semibold text-black">Legacy direct updates</div>
          <p className="text-black">
            Older style, split into separate steps (no v2 receipt):
          </p>
          <ul className="list-disc ml-5 text-black mt-2">
            <li>
              Insert reduction record:{" "}
              <code className="bg-gray-900 text-white px-1 rounded">
                RD:10fd:&lt;productID&gt;
              </code>
            </li>
            <li>
              Subtract stored:{" "}
              <code className="bg-gray-900 text-white px-1 rounded">
                UP:23hs:&lt;productID&gt;
              </code>
            </li>
          </ul>
        </div>
      </section>

      {/* Troubleshooting */}
      <section>
        <h3 className="font-semibold text-black mb-2">Troubleshooting</h3>
        <ul className="list-disc ml-5 text-black">
          <li>
            <strong>Linked product changing Stored twice?</strong> Remove any{" "}
            <code className="bg-gray-900 text-white px-1 rounded">UP:* </code>
            steps for that product. The pool will handle Stored.
          </li>
          <li>
            <strong>“Token column to update” error?</strong> The front-end
            filters dead product IDs before save; backend precheck also cleans
            them if any slip through.
          </li>
          <li>
            <strong>Odd math?</strong> Check <em>quantity</em>,{" "}
            <em>multiplier</em>, and any <em>ratio</em> parameters are valid
            numbers.
          </li>
          <li>
            Use <strong>Run Token Test</strong> to preview what the engine will
            do before committing changes.
          </li>
        </ul>
      </section>
    </div>
  );
}
