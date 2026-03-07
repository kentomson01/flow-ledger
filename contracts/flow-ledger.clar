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