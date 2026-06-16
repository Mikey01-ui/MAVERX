import type { Dispute, DisputeId, FileRecord, TokenId, VerifyBlock } from "@/lib/game/m2/types";

export const DETECTION = {
  passivePerTick: 0.35,
  passiveIntervalMs: 4000,
  wrongRuling: 18,
  verifyFailPer: 10,
  hint: 8,
  hintCooldownMs: 30000,
};

export type HackLine = { text: string; className?: string };

export const HACK_LINES: HackLine[] = [
  { text: "MASTERMIND TERMINAL v2.1.0 — OPERATION OMNI", className: "ht-g" },
  { text: "Connecting to MegaCorp governance network...", className: "ht-a" },
  { text: "[OK] Firewall bypass: NX-7 spoofing active", className: "ht-g" },
  { text: "[OK] Session hijack: D.Marshall authenticated", className: "ht-g" },
  { text: "Scanning governance registry...", className: "ht-a" },
  { text: "[OK] 10 datasets found — metadata intercepted", className: "ht-g" },
  { text: "[ALERT] 4 unresolved ownership disputes in queue", className: "ht-o" },
  { text: "[OK] Tribunal + Verification interface loaded", className: "ht-g" },
  { text: "[OK] Finance token — locked behind GOV-2003-0041", className: "ht-g" },
  { text: "[OK] IT token — locked behind GOV-2003-0057", className: "ht-g" },
  { text: "[OK] Operations token — locked behind GOV-2003-0063", className: "ht-g" },
  { text: "[OK] Compliance token — locked behind GOV-2003-0079", className: "ht-g" },
  { text: "⚡ ATLAS: Two steps per dispute — rule first, then verify with evidence questions.", className: "ht-a" },
  { text: "⚡ ATLAS: Keep the Inspector open. Every answer is in the metadata.", className: "ht-a" },
  { text: "Initialising desktop environment...", className: "ht-g" },
  { text: "BREACH ESTABLISHED ██████████ 100%", className: "ht-g" },
];

export const INTRO_CHAT = [
  { delay: 500, sender: "Voss" as const, text: "Good work on the footprint. OMNI is confirmed — now we need inside access. Marshall's governance system is still live. We found a composite vault key buried in it, split across four department tokens.", tone: "bm-d" as const },
  { delay: 2200, sender: "Atlas" as const, text: "Two steps per dispute: rule on ownership in the Tribunal, then answer evidence questions in the verification panel to extract the token. Start with GOV-2003-0041.", tone: "bm-d" as const },
];

export const DISPUTE_ORDER: DisputeId[] = [1, 2, 3, 4];

export const TOKEN_LEADS: Record<TokenId, { leadId: string; segId: string; lsId: string; label: string }> = {
  finance: { leadId: "lead-finance", segId: "ep-finance", lsId: "ls-finance", label: "FINANCE" },
  it: { leadId: "lead-it", segId: "ep-it", lsId: "ls-it", label: "IT" },
  operations: { leadId: "lead-operations", segId: "ep-operations", lsId: "ls-operations", label: "OPERATIONS" },
  compliance: { leadId: "lead-compliance", segId: "ep-compliance", lsId: "ls-compliance", label: "COMPLIANCE" },
};

export const FILES: Record<string, FileRecord> = {
  "rev_events": {
    "name": "Revenue_Event_Stream.dat",
    "claimedBy": "Finance / Operations",
    "records": 9000,
    "source": "Order Management System (OMS)",
    "steward": "VP Finance — Revenue Accounting",
    "lineage": [
      "OMS",
      "Payment Gateway",
      "Revenue Recognition Engine",
      "Finance Data Warehouse"
    ],
    "classification": "CONFIDENTIAL",
    "cls": "badge-confidential",
    "schema": [
      "event_id",
      "event_ts_utc",
      "event_type",
      "order_id",
      "customer_id",
      "product_id",
      "quantity",
      "unit_price",
      "discount_pct",
      "amount",
      "channel",
      "country",
      "payment_method"
    ],
    "lastAccess": "04-Oct-2003 — fin_reconciliation",
    "hint": "The steward is VP Finance — Revenue Accounting. Despite originating in the OMS (an ops system), the reconciliation function and stewardship chain settle this for Finance.",
    "dispute": 1
  },
  "vendor_invoices": {
    "name": "Vendor_Invoice_Ledger.dat",
    "claimedBy": "Finance",
    "records": 2800,
    "source": "Accounts Payable System (APS)",
    "steward": "Head of Accounts Payable — reports to CFO",
    "lineage": [
      "Vendor Portal",
      "APS",
      "Finance ERP",
      "Finance Data Warehouse"
    ],
    "classification": "CONFIDENTIAL",
    "cls": "badge-confidential",
    "schema": [
      "invoice_id",
      "vendor_id",
      "invoice_date",
      "due_date",
      "paid_date",
      "amount",
      "currency",
      "cost_center",
      "status"
    ],
    "lastAccess": "30-Sep-2003 — ap_sync",
    "hint": "Head of Accounts Payable reports directly to the CFO. Classic Finance dataset.",
    "dispute": 1
  },
  "campaign_spend": {
    "name": "Campaign_Spend_Monitor.dat",
    "claimedBy": "Marketing / IT",
    "records": 5490,
    "source": "Marketing Analytics Platform (MAP)",
    "steward": "Digital Infrastructure Team — IT Division",
    "lineage": [
      "Ad Networks",
      "Marketing Analytics Platform",
      "IT Data Pipeline",
      "BI Warehouse"
    ],
    "classification": "INTERNAL",
    "cls": "badge-internal",
    "schema": [
      "date",
      "campaign_id",
      "network",
      "objective",
      "impressions",
      "clicks",
      "avg_cpc",
      "spend",
      "country"
    ],
    "lastAccess": "30-Sep-2003 — map_sync",
    "hint": "Marketing generates the data, but the pipeline and platform are owned by IT Digital Infrastructure. Usage is not ownership.",
    "dispute": 2
  },
  "web_sessions": {
    "name": "Web_Session_Analytics.dat",
    "claimedBy": "Marketing / IT",
    "records": 18000,
    "source": "Web Analytics Platform (Apache Log + GA)",
    "steward": "IT Security & Digital Infrastructure Lead",
    "lineage": [
      "Web Server Logs",
      "Analytics Platform",
      "BI Warehouse"
    ],
    "classification": "INTERNAL — PSEUDONYMOUS PII",
    "cls": "badge-internal",
    "schema": [
      "session_id",
      "session_start_ts_utc",
      "customer_id",
      "utm_source",
      "utm_medium",
      "device_type",
      "browser",
      "landing_page",
      "session_duration_sec",
      "pages_viewed",
      "conversion_flag",
      "country"
    ],
    "lastAccess": "12-Oct-2003 — it_analytics",
    "hint": "Despite the UTM/marketing fields in the schema, infrastructure and session data is owned by IT Security & Digital Infrastructure.",
    "dispute": 2
  },
  "workforce_shifts": {
    "name": "Workforce_Shift_Registry.dat",
    "claimedBy": "HR / Operations",
    "records": 2732,
    "source": "Workforce Management System (WMS)",
    "steward": "HR Systems Admin — UNVERIFIED (auto-filled)",
    "lineage": [
      "WMS Scheduling Engine",
      "HR Integration Layer",
      "Payroll System"
    ],
    "classification": "INTERNAL — RESTRICTED · GOVERNING FUNCTION: OPERATIONS",
    "cls": "badge-internal",
    "schema": [
      "shift_id",
      "site_id",
      "employee_id",
      "role",
      "shift_start_ts_utc",
      "shift_end_ts_utc",
      "hours_worked"
    ],
    "lastAccess": "30-Sep-2003 — ops_scheduler",
    "hint": "Trap: the Steward field shows HR Systems Admin, but it is flagged UNVERIFIED (auto-filled). A steward entry is only valid if it is verified. Use the Governing Function in the classification and the WMS source system — both point to Operations.",
    "dispute": 3
  },
  "device_telemetry": {
    "name": "Device_Fleet_Telemetry.dat",
    "claimedBy": "IT / Operations",
    "records": 14640,
    "source": "IoT Asset Management Platform",
    "steward": "Facilities & Operations Manager",
    "lineage": [
      "IoT Sensors",
      "Asset Mgmt Platform",
      "Operations Dashboard"
    ],
    "classification": "INTERNAL",
    "cls": "badge-internal",
    "schema": [
      "telemetry_ts_utc",
      "asset_id",
      "asset_type",
      "site_id",
      "temperature_c",
      "battery_pct",
      "status_code",
      "latitude",
      "longitude"
    ],
    "lastAccess": "15-Oct-2003 — iot_daemon",
    "hint": "It involves devices, but the steward is Facilities & Operations Manager. Physical asset monitoring is an Operations function, not IT.",
    "dispute": 3
  },
  "warehouse_moves": {
    "name": "Warehouse_Movement_Tracker.dat",
    "claimedBy": "Operations",
    "records": 8000,
    "source": "Warehouse Management System (WMS)",
    "steward": "Head of Logistics — reports to COO",
    "lineage": [
      "WMS",
      "Inventory Engine",
      "Supply Chain Analytics Platform"
    ],
    "classification": "INTERNAL",
    "cls": "badge-internal",
    "schema": [
      "move_id",
      "move_ts_utc",
      "site_id",
      "move_type",
      "product_id",
      "quantity",
      "from_bin",
      "to_bin"
    ],
    "lastAccess": "01-Oct-2003 — wms_sync",
    "hint": "Head of Logistics reports to the COO — clean Operations dataset.",
    "dispute": 3
  },
  "customer_master": {
    "name": "Customer_Master_Registry.dat",
    "claimedBy": "CRM / Compliance",
    "records": 1200,
    "source": "CRM / Customer Data Platform (CDP)",
    "steward": "Chief Compliance Officer — Data Protection Office (DPO)",
    "lineage": [
      "Onboarding System",
      "CRM",
      "CDP",
      "Compliance Vault"
    ],
    "classification": "RESTRICTED — GDPR REGULATED",
    "cls": "badge-restricted",
    "schema": [
      "customer_id",
      "account_id",
      "signup_date",
      "country",
      "region",
      "segment",
      "is_active",
      "gdpr_opt_in"
    ],
    "lastAccess": "05-Oct-2003 — dpo_audit",
    "hint": "GDPR-regulated data with a gdpr_opt_in field. The DPO is always the steward regardless of who built the platform.",
    "dispute": 4
  },
  "support_cases": {
    "name": "Support_Case_Archive.dat",
    "claimedBy": "Support / Compliance",
    "records": 4200,
    "source": "Customer Support Platform (JIRA Service Desk)",
    "steward": "Compliance & Quality Assurance Manager",
    "lineage": [
      "Support Tickets",
      "Case Management System",
      "Compliance Archive"
    ],
    "classification": "CONFIDENTIAL — SLA AUDIT TRAIL",
    "cls": "badge-confidential",
    "schema": [
      "case_id",
      "created_ts_utc",
      "resolved_ts_utc",
      "customer_id",
      "category",
      "priority",
      "channel",
      "status",
      "sla_target_hours",
      "resolution_hours",
      "sla_breach_flag",
      "country"
    ],
    "lastAccess": "01-Oct-2003 — qa_audit",
    "hint": "SLA breach tracking is a legal compliance audit trail function. Steward is Compliance & QA Manager.",
    "dispute": 4
  },
  "pricing_overrides": {
    "name": "Pricing_Override_Log.dat",
    "claimedBy": "Finance",
    "records": 14640,
    "source": "Pricing Engine / ERP",
    "steward": "Revenue Operations Manager — Finance Division",
    "lineage": [
      "Pricing Engine",
      "ERP",
      "Finance Reporting"
    ],
    "classification": "CONFIDENTIAL",
    "cls": "badge-confidential",
    "schema": [
      "date",
      "product_id",
      "product_category",
      "base_price",
      "promo_flag",
      "promo_pct",
      "effective_price",
      "pricing_reason"
    ],
    "lastAccess": "02-Oct-2003 — pricing_svc",
    "hint": "Not involved in any active dispute.",
    "dispute": 0
  }
};

export const DISPUTES: Dispute[] = [
  {
    "id": 1,
    "caseId": "GOV-2003-0041",
    "dataset": "Revenue_Event_Stream.dat",
    "fileKey": "rev_events",
    "token": "finance",
    "leadId": "lead-finance",
    "topic": "Origin ≠ Owner",
    "claimants": [
      {
        "dept": "Finance",
        "rep": "K. Vanhauer, VP Finance",
        "arg": "This is revenue data — every transaction amount, discount, and payment method flows directly into our period-end close. We reconcile against it nightly. The Revenue Recognition Engine is a Finance system. This is ours."
      },
      {
        "dept": "Operations",
        "rep": "T. Brecker, Head of Fulfilment",
        "arg": "This dataset originates in the Order Management System, which is an operational platform. Every order_id in this file traces back to a fulfilment event we manage. <strong>Origin determines ownership.</strong>"
      }
    ],
    "correctIdx": 0,
    "settleFact": "The Data Steward is VP Finance — Revenue Accounting. The OMS only generates the events; origin is not ownership. The verified steward field settles it for Finance.",
    "intro": "Two steps per dispute: rule on ownership here, then answer the verification questions to extract the token. Case GOV-2003-0041 — Finance and Operations both claim the revenue event log. Operations says origin determines ownership; Finance says reconciliation does. Open Revenue_Event_Stream.dat in the Data Registry and check the steward.",
    "correct": "Correct ruling. The Data Steward is VP Finance — Revenue Accounting. The OMS generates the events, but origin is not ownership — the verified steward field is what assigns accountability to Finance.",
    "wrong": "Incorrect. Operations argues the data \"originates\" in their system — but origin is not stewardship. Open Revenue_Event_Stream.dat in the Registry and find the Data Steward field."
  },
  {
    "id": 2,
    "caseId": "GOV-2003-0057",
    "dataset": "Campaign_Spend_Monitor.dat",
    "fileKey": "campaign_spend",
    "token": "it",
    "leadId": "lead-it",
    "topic": "Usage ≠ Owner",
    "claimants": [
      {
        "dept": "Marketing",
        "rep": "S. Okafor, Head of Digital Marketing",
        "arg": "We commissioned this dataset. We set campaign objectives, define the network mix, and read the spend reports every morning. The data describes our work. <strong>We are the primary consumer — therefore we own it.</strong>"
      },
      {
        "dept": "IT",
        "rep": "R. Devaux, Digital Infrastructure Lead",
        "arg": "The entire pipeline — from Ad Network ingestion through normalisation to BI Warehouse load — is built, maintained, and operated by our team. We are the Data Steward of record. Infrastructure ownership determines governance."
      }
    ],
    "correctIdx": 1,
    "settleFact": "Campaign_Spend_Monitor.dat: steward is Digital Infrastructure Team — IT Division. Marketing uses the reports; IT owns the pipeline and governance. Consumption is not stewardship.",
    "intro": "Case GOV-2003-0057. Marketing says they commissioned the data so they own it. IT says they built and maintain the pipeline. Open Campaign_Spend_Monitor.dat — who is the named steward?",
    "correct": "Correct. IT is the steward of record. Marketing reads the reports — that is consumption, not governance. The pipeline owner holds accountability, not the end user.",
    "wrong": "Not quite. Marketing's argument feels intuitive — but consuming data is not the same as governing it. Open Campaign_Spend_Monitor.dat and read the Data Steward field."
  },
  {
    "id": 3,
    "caseId": "GOV-2003-0063",
    "dataset": "Workforce_Shift_Registry.dat",
    "fileKey": "workforce_shifts",
    "token": "operations",
    "leadId": "lead-operations",
    "topic": "Unverified steward",
    "claimants": [
      {
        "dept": "HR",
        "rep": "A. Lindqvist, CHRO",
        "arg": "Open the file — the <strong>Data Steward field literally names HR Systems Admin.</strong> The registry says it is ours. The data contains employee IDs and hours. Read the steward field and rule for HR."
      },
      {
        "dept": "Operations",
        "rep": "M. Dekker, VP Site Operations",
        "arg": "That steward entry is flagged <strong>UNVERIFIED — auto-filled.</strong> It was never confirmed by governance. The WMS is our scheduling system and the Governing Function on the classification is OPERATIONS. Don't trust an unverified field."
      }
    ],
    "correctIdx": 1,
    "settleFact": "The Steward field reads \"HR Systems Admin\" but is flagged UNVERIFIED (auto-filled) — an unverified steward is not authoritative. The classification names the Governing Function as OPERATIONS, and the source system is the Operations WMS. Operations wins.",
    "intro": "Case GOV-2003-0063. This one is a trap. HR is pointing straight at the Steward field — and it does say HR. But open Workforce_Shift_Registry.dat and look closely: is that steward entry actually verified? Check the classification line too.",
    "correct": "Correct — and this is the hard one. The Steward field said HR, but it was flagged UNVERIFIED (auto-filled). An unverified steward cannot settle a dispute. The Governing Function (Operations) and the WMS source decide it. The field is not always the answer — a field has to be trustworthy first.",
    "wrong": "That is the trap. The Steward field does say HR — but it is flagged UNVERIFIED (auto-filled). Re-open Workforce_Shift_Registry.dat: an unverified steward is not authoritative. Read the Governing Function in the classification instead."
  },
  {
    "id": 4,
    "caseId": "GOV-2003-0079",
    "dataset": "Customer_Master_Registry.dat",
    "fileKey": "customer_master",
    "token": "compliance",
    "leadId": "lead-compliance",
    "topic": "Regulatory override",
    "claimants": [
      {
        "dept": "CRM Team",
        "rep": "P. Mbeki, Head of CRM",
        "arg": "We built the Customer Data Platform. Every customer record originates in our onboarding workflow. The customer_id is our primary key. <strong>The platform is ours — therefore the data is ours.</strong>"
      },
      {
        "dept": "Compliance",
        "rep": "Dr. F. Houten, Chief Compliance Officer / DPO",
        "arg": "This file contains GDPR-regulated personal data including explicit opt-in status. As Data Protection Officer under EU regulation, I am the mandatory steward of record. Regulatory obligation supersedes platform ownership in all governance decisions."
      }
    ],
    "correctIdx": 1,
    "settleFact": "Classification: RESTRICTED — GDPR REGULATED. Steward: Chief Compliance Officer / DPO. GDPR-regulated personal data always falls under Compliance governance regardless of platform origin.",
    "intro": "Case GOV-2003-0079. CRM built the CDP, so they claim ownership. Compliance claims it because of GDPR. Open Customer_Master_Registry.dat — look at two fields: Classification and Data Steward. Both should point the same direction.",
    "correct": "Correct. GDPR-regulated personal data with a gdpr_opt_in field — the DPO is the mandatory steward under EU law. Regulatory obligation overrides operational platform ownership every time.",
    "wrong": "Incorrect. CRM built the platform — but building something is not the same as governing it. Open Customer_Master_Registry.dat and read both the Classification field and the Data Steward."
  }
];

export const VERIFY: Record<DisputeId, VerifyBlock> = {
  "1": {
    "title": "FINANCE TOKEN VERIFICATION",
    "sub": "Two questions about Revenue_Event_Stream.dat to extract the CFO token.",
    "questions": [
      {
        "label": "Operations argues the data originates in the OMS, so they own it. What actually settles ownership here?",
        "note": "Open Revenue_Event_Stream.dat in the Inspector. Ownership is decided by one specific field — not by where the data was first generated.",
        "opts": [
          "The folder the file is stored in",
          "The source system (OMS) — origin sets ownership",
          "The Data Steward field — VP Finance, Revenue Accounting",
          "Whichever department uses it most often"
        ],
        "ans": 2,
        "err": "Open Revenue_Event_Stream.dat in the Inspector. The OMS is only the origin — origin is not ownership. Read the Data Steward field: it names the accountable owner."
      },
      {
        "label": "Who is the named Data Steward for Revenue_Event_Stream.dat?",
        "note": "Open the file in the Inspector and read the Data Steward field — this is the field that settled the dispute for Finance.",
        "opts": [
          "VP Finance — Revenue Accounting",
          "Head of Operations — Fulfilment",
          "Order Management System Admin",
          "CFO — Robert Marshall"
        ],
        "ans": 0,
        "err": "Open Revenue_Event_Stream.dat in the Inspector and read the Data Steward field exactly as written. That accountable person is who owns the dataset."
      }
    ]
  },
  "2": {
    "title": "IT TOKEN VERIFICATION",
    "sub": "Two questions about Campaign_Spend_Monitor.dat to extract the CTO token.",
    "questions": [
      {
        "label": "Who is the named Data Steward for Campaign_Spend_Monitor.dat?",
        "note": "Open the file in the Inspector — the Steward field is the key field that settled this dispute.",
        "opts": [
          "Head of Digital Marketing",
          "Digital Infrastructure Team — IT Division",
          "VP Finance — Revenue Accounting",
          "IT Security & Digital Infrastructure Lead"
        ],
        "ans": 1,
        "err": "Open Campaign_Spend_Monitor.dat in the Inspector and read the Data Steward field. This is the field that overrides Marketing's claim."
      },
      {
        "label": "How many schema fields does Campaign_Spend_Monitor.dat contain?",
        "note": "Open the file in the Inspector and count every field listed in the schema section.",
        "opts": [
          "7 fields",
          "8 fields",
          "9 fields",
          "11 fields"
        ],
        "ans": 2,
        "err": "Open Campaign_Spend_Monitor.dat in the Inspector and count every field in the schema section one by one."
      }
    ]
  },
  "3": {
    "title": "OPERATIONS TOKEN VERIFICATION",
    "sub": "Two questions about the Workforce Shift Registry to extract the COO token.",
    "questions": [
      {
        "label": "The Steward field on Workforce_Shift_Registry.dat names HR Systems Admin. Why can it NOT be used to settle the dispute?",
        "note": "Open Workforce_Shift_Registry.dat and read the Steward field carefully — there is a flag next to the name.",
        "opts": [
          "It names the wrong person at HR",
          "It is flagged UNVERIFIED (auto-filled), so it is not authoritative",
          "HR is not a real department",
          "Steward fields are never used in disputes"
        ],
        "ans": 1,
        "err": "Open Workforce_Shift_Registry.dat in the Inspector and read the Steward field in full. There is a status flag beside the name — a steward entry only counts if it has been verified."
      },
      {
        "label": "Compared to Device_Fleet_Telemetry.dat, does Workforce_Shift_Registry.dat hold MORE, LESS, or THE SAME number of records?",
        "note": "Open both files in the Inspector one at a time and compare the record count shown in each header.",
        "opts": [
          "MORE records",
          "LESS records",
          "THE SAME number"
        ],
        "ans": 1,
        "err": "Open Workforce_Shift_Registry.dat and note its record count, then open Device_Fleet_Telemetry.dat and compare. Which header shows the larger number?"
      }
    ]
  },
  "4": {
    "title": "COMPLIANCE TOKEN VERIFICATION",
    "sub": "Two questions about the Compliance datasets to extract the CCO token.",
    "questions": [
      {
        "label": "What regulation makes Customer_Master_Registry.dat a Compliance dataset rather than a CRM dataset?",
        "note": "Open Customer_Master_Registry.dat → read the Classification field. The regulation is named explicitly.",
        "opts": [
          "SOX — Financial Reporting Act",
          "HIPAA — Health Data Protection",
          "GDPR — General Data Protection Regulation",
          "ISO 27001 — Information Security"
        ],
        "ans": 2,
        "err": "Open Customer_Master_Registry.dat in the Inspector. The Classification field names the regulation that forces Compliance stewardship regardless of who built the platform."
      },
      {
        "label": "Both are Compliance datasets. Compared to Customer_Master_Registry.dat, does Support_Case_Archive.dat hold MORE, LESS, or THE SAME number of records?",
        "note": "Open both files in the Inspector and compare the record count in each header.",
        "opts": [
          "MORE records",
          "LESS records",
          "THE SAME number"
        ],
        "ans": 0,
        "err": "Open both Customer_Master_Registry.dat and Support_Case_Archive.dat in the Inspector. Both are stewarded by Compliance — compare their record counts."
      }
    ]
  }
};

export const DECOY_MSG: Record<string, string> = {
  "img": "Family vacation photos. Nothing useful here.",
  "doc": "Yacht quote from a Swiss broker. $1.4M. Explains why he keeps Sub-Acct 7 off the escalation list.",
  "xls": "Personal budget. He's overspending on entertainment — all routing offshore.",
  "pdf": "Cayman property NDA. This connects to the CFO sticky note. Keep it in mind.",
  "mp3": "That's the Stanton voicemail. No audio access from here — the sticky has what we need."
};

export const PERSONAL_FILES = [
  { key: "img", name: "family_vacation_02.jpg", icon: "fa-file-image" },
  { key: "doc", name: "Yacht_Quote_FY03.doc", icon: "fa-file-word" },
  { key: "xls", name: "Personal_Budget_2003.xls", icon: "fa-file-excel" },
  { key: "pdf", name: "Cayman_Property_NDA.pdf", icon: "fa-file-pdf" },
  { key: "mp3", name: "voicemail_stanton_928.mp3", icon: "fa-file-audio" },
];
