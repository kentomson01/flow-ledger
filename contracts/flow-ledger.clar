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