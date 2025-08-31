// NodeFlowGuide.jsx
import React from "react";

/**
 * Props:
 * - isLinked: boolean  → is this product linked to a virtual stock pool?
 * - route: "activation" | "reduction" | "shipment"  → current node view (optional)
 * - productName?: string
 */
export default function NodeFlowGuide({ isLinked, route, productName }) {
  const laneTitle =
    route === "activation"
      ? "Activation lane"
      : route === "reduction"
      ? "Reduction lane"
      : route === "shipment"
      ? "Shipment lane"
      : "Node program";

  return (
    <div className="mt-6 text-sm leading-6">
      {/* Heads-up banner (pool awareness) */}
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
            <span className="underline">What to do:</span>{" "}
            <strong>activate</strong>, <strong>apply receipts</strong>, and{" "}
            <strong>record shipments</strong> as usual —{" "}
            <strong>don’t manually change Stored</strong>. The pool keeps Stored
            in sync for you.
          </p>
        ) : (
          <p className="text-black">
            This product is <strong>not linked</strong> to a pool. You can
            activate, reduce with a scanner, receive shipments, and directly
            adjust stock if needed.
          </p>
        )}
      </div>

      {/* What the lanes mean in everyday terms */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">
          {laneTitle}: what it means on the iPad
        </h3>
        <div className="grid gap-2">
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Activation</strong> — use this when, on the iPad, you{" "}
            <em>activate</em> a product and move it to the{" "}
            <em>ready (on-the-shelf)</em> area.
          </div>
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Reduction</strong> — this matches the <em>scanner flow</em>{" "}
            on the iPad when a product is <em>used/consumed</em> (you scan and
            deduct).
          </div>
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Shipment</strong> — use this when, on the iPad, you{" "}
            <em>receive a shipment</em> and add it into inventory.
          </div>
        </div>
      </section>

      {/* Quick glossary: Stored vs Active, and Programs */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">Quick glossary</h3>
        <div className="grid gap-2">
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Stored</strong> — inventory that’s “in the garage,” not yet
            ready for pick-pack. (Back room / warehouse)
          </div>
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Active</strong> — inventory that’s “on the shelf,” ready to
            fulfill/dispense. Activation moves items from{" "}
            <em>Stored → Active</em>.
          </div>
          <div className="bg-white/70 border border-gray-300 rounded p-3 text-black">
            <strong>Program (Tokens)</strong> — the node graph builds a
            “program” for this product. Think of it as your step-by-step recipe
            the engine follows when the iPad flow runs.
          </div>
        </div>
      </section>

      {/* Receipts (v2) — plain english */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">
          Receipts (v2): why we keep them
        </h3>
        <div className="rounded border border-green-600 bg-green-50 p-3 text-black">
          <p className="mb-2">
            A <strong>receipt</strong> is a small record saved with each change
            (who, what, how many, when). It’s like a store receipt — a clear
            paper trail.
          </p>
          <ul className="list-disc ml-5">
            <li>
              <strong>Undo (revert) is safe</strong> — we can reverse the exact
              change because we know precisely what happened.
            </li>
            <li>
              <strong>Audits are easy</strong> — you can see the full history of
              what was done.
            </li>
            <li>
              <strong>Less mistakes</strong> — the record and the math stay in
              lockstep.
            </li>
          </ul>
        </div>
      </section>

      {/* Token Test explanation (simulate iPad with 100) */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">Token Test (preview)</h3>
        <div className="rounded border border-blue-300 bg-blue-50 p-3 text-black">
          <p className="mb-2">
            Token Test pretends you did the iPad action with a{" "}
            <strong>test quantity of 100</strong>.
          </p>
          <ul className="list-disc ml-5">
            <li>
              <strong>Activation test:</strong> imagine you activated 100 — the
              preview shows how 100 would move into Active (and Stored adjusts
              accordingly).
            </li>
            <li>
              <strong>Reduction test:</strong> imagine the scanner deducted 100
              — the preview shows how 100 would come out.
            </li>
            <li>
              <strong>Shipment test:</strong> imagine you received 100 — the
              preview shows how 100 would be added.
            </li>
          </ul>
          <p className="mt-2">
            This is just a <em>preview</em> for understanding. Your real iPad
            action will use whatever quantity you enter there.
          </p>
        </div>
      </section>

      {/* Working with pools (keep it simple) */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">
          If this product is linked to a pool
        </h3>
        <div className="rounded border border-blue-600 bg-blue-50 p-3 text-black">
          <ul className="list-disc ml-5">
            <li>
              Keep using normal Activation, Reduction, and Shipment flows.
            </li>
            <li>
              <strong>Don’t manually edit Stored</strong> — the pool keeps
              Stored in sync for everything linked to it.
            </li>
            <li>
              Receipts still matter: they make reversions/audits clean even with
              pools.
            </li>
          </ul>
        </div>
      </section>

      {/* Common recipes (high-level) */}
      <section className="mb-6">
        <h3 className="font-semibold text-black mb-2">Common recipes</h3>

        <div className="rounded border border-gray-300 p-3 bg-white/60 mb-3">
          <div className="font-semibold text-black">Activate</div>
          <p className="text-black">
            Use when you move items from Stored → Active (ready to use). The
            system also saves a receipt so you can undo later if needed.
          </p>
        </div>

        <div className="rounded border border-gray-300 p-3 bg-white/60 mb-3">
          <div className="font-semibold text-black">Reduce with scanner</div>
          <p className="text-black">
            Use when you scan items out. The system records the deduction and
            keeps a receipt for reversions.
          </p>
        </div>

        <div className="rounded border border-gray-300 p-3 bg-white/60 mb-3">
          <div className="font-semibold text-black">Receive a shipment</div>
          <p className="text-black">
            Use when new stock arrives. It’s recorded with a receipt (so you can
            undo if the shipment was entered by mistake).
          </p>
        </div>
      </section>

      {/* Troubleshooting — simplified */}
      <section>
        <h3 className="font-semibold text-black mb-2">Troubleshooting</h3>
        <ul className="list-disc ml-5 text-black">
          <li>
            <strong>Linked product changing Stored twice?</strong> Remove any
            manual Stored edits in the program. The pool will handle Stored.
          </li>
          <li>
            <strong>Numbers look off?</strong> Check your quantity (and any
            ratio/multiplier if the product uses them).
          </li>
          <li>
            Use <strong>Run Token Test</strong> to see the effect of a{" "}
            <em>100-unit</em> example before you commit changes.
          </li>
        </ul>
      </section>
    </div>
  );
}
