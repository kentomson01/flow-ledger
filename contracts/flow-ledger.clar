;; FlowLedger Core Contract
;; Handles business registration, organization management, and payroll execution.
;; Supports both STX and sBTC payments.

;; Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-ALREADY-REGISTERED (err u101))
(define-constant ERR-NOT-REGISTERED (err u102))
(define-constant ERR-ORG-ALREADY-EXISTS (err u103))
(define-constant ERR-INSUFFICIENT-FUNDS (err u104))
(define-constant ERR-INVALID-AMOUNT (err u105))
(define-constant ERR-LIST-MISMATCH (err u106))
(define-constant ERR-TRANSFER-FAILED (err u107))
(define-constant ERR-SBTC-TRANSFER-FAILED (err u108))

;; sBTC token addresses (Clarinet auto-remaps for testnet/mainnet):
;;   Simnet/Devnet: SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
;;   Testnet:       ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token
;; Data Maps
(define-map businesses
  principal
  {
    registered: bool,
    org-id: (optional uint),
  }
)

(define-map organizations
  uint
  {
    owner: principal,
    name: (string-ascii 64),
  }
)

(define-map freelancer-registry
  principal
  { registered: bool }
)

;; Data Vars
(define-data-var last-org-id uint u0)

;; --- Read-Only Functions ---
(define-read-only (get-business-info (business principal))
  (map-get? businesses business)
)

(define-read-only (get-org-info (org-id uint))
  (map-get? organizations org-id)
)

(define-read-only (is-freelancer-registered (freelancer principal))
  (default-to false (get registered (map-get? freelancer-registry freelancer)))
)

;; --- Public Functions ---
;; Register a business wallet with FlowLedger
(define-public (register-business)
  (let ((caller tx-sender))
    (asserts! (is-none (get-business-info caller)) ERR-ALREADY-REGISTERED)
    (ok (map-set businesses caller {
      registered: true,
      org-id: none,
    }))
  )
)

;; Create a FlowLedger organization (one per business for MVP)
(define-public (create-organization (name (string-ascii 64)))
  (let (
      (caller tx-sender)
      (business (unwrap! (get-business-info caller) ERR-NOT-REGISTERED))
      (new-id (+ (var-get last-org-id) u1))
    )
    (asserts! (is-none (get org-id business)) ERR-ORG-ALREADY-EXISTS)

    (map-set organizations new-id {
      owner: caller,
      name: name,
    })
    (map-set businesses caller {
      registered: true,
      org-id: (some new-id),
    })
    (var-set last-org-id new-id)
    (ok new-id)
  )
)

;; Register a freelancer in the FlowLedger registry
(define-public (register-freelancer)
  (ok (map-set freelancer-registry tx-sender { registered: true }))
)

;; Execute a single payroll payment via FlowLedger (STX Transfer)
(define-public (execute-payroll
    (recipient principal)
    (amount uint)
  )
  (let (
      (caller tx-sender)
      (business (unwrap! (get-business-info caller) ERR-NOT-REGISTERED))
    )
    ;; 1. Check if caller owns a FlowLedger organization
    (asserts! (is-some (get org-id business)) ERR-NOT-AUTHORIZED)

    ;; 2. Validate amount
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    ;; 3. Transfer STX
    (try! (stx-transfer? amount caller recipient))

    ;; 4. Emit FlowLedger payment event
    (print {
      event: "flowledger-payroll-payment",
      payer: caller,
      recipient: recipient,
      amount: amount,
    })

    (ok true)
  )
)

;; --- FlowLedger Batch Payroll ---
;; Private helper: process a single payment in the FlowLedger batch
(define-private (process-single-payment
    (entry {
      to: principal,
      ustx: uint,
    })
    (prev-result (response bool uint))
  )
  (match prev-result
    success (stx-transfer? (get ustx entry) tx-sender (get to entry))
    error (err error)
  )
)

;; Execute Batch Payroll via FlowLedger (up to 20 recipients in one transaction)
(define-public (execute-batch-payroll
    (recipients (list 20 {
      to: principal,
      ustx: uint,
    }))
    (period-ref (string-ascii 32))
  )
  (let (
      (caller tx-sender)
      (business (unwrap! (get-business-info caller) ERR-NOT-REGISTERED))
      (count (len recipients))
    )
    ;; 1. Verify caller owns a FlowLedger organization
    (asserts! (is-some (get org-id business)) ERR-NOT-AUTHORIZED)

    ;; 2. Verify list is not empty
    (asserts! (> count u0) ERR-INVALID-AMOUNT)

    ;; 3. Execute all FlowLedger transfers using fold (atomic - all or nothing)
    (try! (fold process-single-payment recipients (ok true)))

    ;; 4. Emit FlowLedger batch event
    (print {
      event: "flowledger-batch-payroll",
      payer: caller,
      recipient-count: count,
      period: period-ref,
    })

    (ok true)
  )
)

;; --- FlowLedger sBTC Payroll ---

;; Execute a single sBTC payroll payment
(define-public (execute-sbtc-payroll
    (recipient principal)
    (amount uint)
  )
  (let (
      (caller tx-sender)
      (business (unwrap! (get-business-info caller) ERR-NOT-REGISTERED))
    )
    ;; 1. Check if caller owns a FlowLedger organization
    (asserts! (is-some (get org-id business)) ERR-NOT-AUTHORIZED)

    ;; 2. Validate amount
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    ;; 3. Transfer sBTC via SIP-010 (literal required by contract-call?)
    (unwrap!
      (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
        transfer amount caller recipient none
      )
      ERR-SBTC-TRANSFER-FAILED
    )

    ;; 4. Emit FlowLedger sBTC payment event
    (print {
      event: "flowledger-sbtc-payroll",
      payer: caller,
      recipient: recipient,
      amount: amount,
    })

    (ok true)
  )
)

;; Private helper: process a single sBTC payment in a batch
(define-private (process-single-sbtc-payment
    (entry {
      to: principal,
      amount: uint,
    })
    (prev-result (response bool uint))
  )
  (match prev-result
    success (match (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
      transfer (get amount entry) tx-sender (get to entry) none
    )
      ok-val (ok true)
      err-val (err u108)
    )
    error (err error)
  )
)

;; Execute Batch sBTC Payroll (up to 20 recipients in one transaction)
(define-public (execute-batch-sbtc-payroll
    (recipients (list 20 {
      to: principal,
      amount: uint,
    }))
    (period-ref (string-ascii 32))
  )
  (let (
      (caller tx-sender)
      (business (unwrap! (get-business-info caller) ERR-NOT-REGISTERED))
      (count (len recipients))
    )
    ;; 1. Verify caller owns a FlowLedger organization
    (asserts! (is-some (get org-id business)) ERR-NOT-AUTHORIZED)

    ;; 2. Verify list is not empty
    (asserts! (> count u0) ERR-INVALID-AMOUNT)

    ;; 3. Execute all sBTC transfers using fold (atomic - all or nothing)
    (try! (fold process-single-sbtc-payment recipients (ok true)))

    ;; 4. Emit FlowLedger batch sBTC event
    (print {
      event: "flowledger-batch-sbtc-payroll",
      payer: caller,
      recipient-count: count,
      period: period-ref,
    })

    (ok true)
  )
)
