/** Curated Chennai industrial dataset — no lorem ipsum. */

const CHENNAI_LOCATIONS = [
  "Guindy, Chennai",
  "Ambattur Industrial Estate, Chennai",
  "Sriperumbudur, Kanchipuram",
  "Oragadam Industrial Corridor, Chennai",
  "Thirumudivakkam, Chennai",
  "Ennore, Chennai",
  "Manali, Chennai",
  "Pallavaram, Chennai",
  "Porur, Chennai",
  "Chromepet, Chennai",
  "Tambaram, Chennai",
  "Avadi, Chennai",
  "Poonamallee, Chennai",
  "Sholinganallur, Chennai",
  "Perungudi, Chennai",
];

const PROVIDER_PROFILES = [
  {
    companyName: "Kovai Metal Recovery Pvt Ltd",
    industryType: "Metal processing",
    materialTypes: ["Industrial metal shavings", "Aluminum offcuts", "Steel turnings"],
    responseRate: 88,
    averageResponseTime: "Within 4–8 business hours",
  },
  {
    companyName: "Ambattur Plastics Reclamation",
    industryType: "Plastics",
    materialTypes: ["HDPE plastic scrap", "PET flakes", "PP regrind"],
    responseRate: 82,
    averageResponseTime: "Same business day",
  },
  {
    companyName: "Sriperumbudur Textile Byproducts Co.",
    industryType: "Textiles",
    materialTypes: ["Textile cotton byproduct", "Polyester offcuts", "Yarn waste"],
    responseRate: 76,
    averageResponseTime: "Within 24 hours",
  },
  {
    companyName: "Ennore Industrial Scrap Exchange",
    industryType: "Scrap trading",
    materialTypes: ["Mixed ferrous scrap", "Copper cable ends", "Brass swarf"],
    responseRate: 91,
    averageResponseTime: "Within 2–4 hours",
  },
  {
    companyName: "Thirumudivakkam Packaging Recovery",
    industryType: "Packaging",
    materialTypes: ["Corrugated paper waste", "LDPE film bales", "Printed carton trim"],
    responseRate: 70,
    averageResponseTime: "Within 1 business day",
  },
  {
    companyName: "Manali Chemicals Byproduct Desk",
    industryType: "Chemicals",
    materialTypes: ["Solvent recovery residue", "HDPE drums (emptied)", "Industrial liners"],
    responseRate: 65,
    averageResponseTime: "Within 48 hours",
  },
  {
    companyName: "Oragadam Precision Metals",
    industryType: "Precision engineering",
    materialTypes: ["Aluminum offcuts", "Stainless machining chips", "Titanium scrap lots"],
    responseRate: 85,
    averageResponseTime: "Within 6 hours",
  },
  {
    companyName: "Pallavaram Rubber Reclaim Works",
    industryType: "Rubber",
    materialTypes: ["Rubber byproducts", "EPDM trim", "Conveyor belt sections"],
    responseRate: 72,
    averageResponseTime: "Within 24 hours",
  },
  {
    companyName: "Guindy E-Waste Segregation Unit",
    industryType: "Electronics recovery",
    materialTypes: ["Electronic component scrap", "PCB trim", "Cable harness waste"],
    responseRate: 78,
    averageResponseTime: "Within 12 hours",
  },
  {
    companyName: "Porur Paper & Board Recovery",
    industryType: "Paper",
    materialTypes: ["Corrugated paper waste", "Kraft roll ends", "Label backing waste"],
    responseRate: 80,
    averageResponseTime: "Within 8 hours",
  },
  {
    companyName: "Chromepet Polymer Extrusion Surplus",
    industryType: "Plastics",
    materialTypes: ["PET flakes", "HDPE plastic scrap", "ABS purge"],
    responseRate: 74,
    averageResponseTime: "Within 1 business day",
  },
  {
    companyName: "Tambaram Foundry Byproduct Supply",
    industryType: "Foundry",
    materialTypes: ["Cast iron borings", "Sand reclamation fines", "Steel risers"],
    responseRate: 68,
    averageResponseTime: "Within 36 hours",
  },
  {
    companyName: "Avadi Automotive Trim Recovery",
    industryType: "Automotive",
    materialTypes: ["PP regrind", "Textile cotton byproduct", "Foam offcuts"],
    responseRate: 83,
    averageResponseTime: "Within 6 hours",
  },
  {
    companyName: "Poonamallee Glass & Mineral Waste",
    industryType: "Minerals",
    materialTypes: ["Crushed glass cullet", "Ceramic scrap", "Feldspar fines"],
    responseRate: 60,
    averageResponseTime: "Within 48 hours",
  },
  {
    companyName: "Sholinganallur Industrial Logistics Surplus",
    industryType: "Logistics",
    materialTypes: ["Mixed pallets (repair grade)", "Stretch film bales", "Strapping waste"],
    responseRate: 77,
    averageResponseTime: "Within 12 hours",
  },
  {
    companyName: "Perungudi IT Hardware Recovery",
    industryType: "Electronics recovery",
    materialTypes: ["Electronic component scrap", "Server chassis scrap", "Copper heat sinks"],
    responseRate: 86,
    averageResponseTime: "Within 4 hours",
  },
  {
    companyName: "North Chennai Metal Shavings Co.",
    industryType: "Metal processing",
    materialTypes: ["Industrial metal shavings", "Aluminum offcuts", "Zinc die-cast scrap"],
    responseRate: 79,
    averageResponseTime: "Within 8 hours",
  },
  {
    companyName: "South Chennai Recovery Alliance",
    industryType: "Multi-material",
    materialTypes: ["HDPE plastic scrap", "Corrugated paper waste", "Mixed ferrous scrap"],
    responseRate: 90,
    averageResponseTime: "Within 3 hours",
  },
];

const BUYER_PROFILES = [
  {
    companyName: "Chennai Recycler Collective",
    industryType: "Recycling",
    materialTypes: ["HDPE plastic scrap", "PET flakes", "PP regrind"],
    industriesHandled: ["Plastics", "Packaging"],
  },
  {
    companyName: "South India Metal Aggregators",
    industryType: "Metal trading",
    materialTypes: ["Industrial metal shavings", "Aluminum offcuts", "Steel turnings"],
    industriesHandled: ["Metal processing", "Automotive"],
  },
  {
    companyName: "Tamil Nadu Textile Recovery Operators",
    industryType: "Textile recovery",
    materialTypes: ["Textile cotton byproduct", "Polyester offcuts"],
    industriesHandled: ["Textiles", "Garments"],
  },
  {
    companyName: "Ennore Secondary Raw Materials",
    industryType: "Secondary materials",
    materialTypes: ["Mixed ferrous scrap", "Copper cable ends", "Brass swarf"],
    industriesHandled: ["Scrap trading", "Metal processing"],
  },
  {
    companyName: "Ambattur Polymer Processors",
    industryType: "Polymer processing",
    materialTypes: ["HDPE plastic scrap", "PET flakes", "ABS purge"],
    industriesHandled: ["Plastics"],
  },
  {
    companyName: "Guindy Paperboard Recovery Desk",
    industryType: "Paper recovery",
    materialTypes: ["Corrugated paper waste", "Kraft roll ends"],
    industriesHandled: ["Paper", "Packaging"],
  },
  {
    companyName: "Oragadam Recovery Operations",
    industryType: "Industrial recovery",
    materialTypes: ["Aluminum offcuts", "Rubber byproducts", "Electronic component scrap"],
    industriesHandled: ["Automotive", "Electronics recovery"],
  },
  {
    companyName: "Pallavaram Circular Materials",
    industryType: "Circular economy",
    materialTypes: ["PP regrind", "PET flakes", "Corrugated paper waste"],
    industriesHandled: ["Packaging", "Plastics"],
  },
  {
    companyName: "Chennai E-Waste Recovery Partners",
    industryType: "E-waste",
    materialTypes: ["Electronic component scrap", "PCB trim", "Cable harness waste"],
    industriesHandled: ["Electronics recovery"],
  },
  {
    companyName: "Kanchipuram Industrial Aggregators",
    industryType: "Aggregation",
    materialTypes: ["Industrial metal shavings", "HDPE plastic scrap", "Textile cotton byproduct"],
    industriesHandled: ["Multi-material"],
  },
  {
    companyName: "Tambaram Rubber & Polymer Buyers",
    industryType: "Rubber & plastics",
    materialTypes: ["Rubber byproducts", "EPDM trim", "PP regrind"],
    industriesHandled: ["Rubber", "Automotive"],
  },
  {
    companyName: "Chromepet Recovery Mandate Office",
    industryType: "Recovery operations",
    materialTypes: ["PET flakes", "Printed carton trim", "LDPE film bales"],
    industriesHandled: ["Packaging"],
  },
  {
    companyName: "Avadi Automotive Materials Desk",
    industryType: "Automotive supply",
    materialTypes: ["Aluminum offcuts", "Foam offcuts", "PP regrind"],
    industriesHandled: ["Automotive"],
  },
  {
    companyName: "Porur Secondary Fiber Traders",
    industryType: "Fiber trading",
    materialTypes: ["Corrugated paper waste", "Label backing waste"],
    industriesHandled: ["Paper"],
  },
  {
    companyName: "Manali Chemical Recovery Buyers",
    industryType: "Chemical recovery",
    materialTypes: ["HDPE drums (emptied)", "Industrial liners", "Solvent recovery residue"],
    industriesHandled: ["Chemicals"],
  },
  {
    companyName: "North Chennai Scrap Procurement",
    industryType: "Procurement",
    materialTypes: ["Mixed ferrous scrap", "Cast iron borings", "Steel risers"],
    industriesHandled: ["Foundry", "Scrap trading"],
  },
  {
    companyName: "South Chennai Mandate Buyers LLP",
    industryType: "Buyer consortium",
    materialTypes: ["HDPE plastic scrap", "Industrial metal shavings", "Electronic component scrap"],
    industriesHandled: ["Plastics", "Metal processing", "Electronics recovery"],
  },
  {
    companyName: "Chennai Premium Recovery Network",
    industryType: "Recovery network",
    materialTypes: ["Aluminum offcuts", "PET flakes", "Textile cotton byproduct"],
    industriesHandled: ["Textiles", "Plastics", "Metal processing"],
  },
];

const MATERIAL_TEMPLATES = [
  {
    title: "HDPE injection purge — food-grade line",
    materialType: "HDPE plastic scrap",
    unit: "MT",
    qty: [8, 24],
    description:
      "Post-production HDPE purge from injection molding. Baled, stored under cover at Guindy facility. Suitable for regrind after QC.",
  },
  {
    title: "PET bottle flake — clear stream",
    materialType: "PET flakes",
    unit: "MT",
    qty: [12, 40],
    description:
      "Washed PET flakes from bottle recovery line. Moisture controlled. Documentation available for export-minded buyers.",
  },
  {
    title: "Textile cotton byproduct bales",
    materialType: "Textile cotton byproduct",
    unit: "MT",
    qty: [5, 18],
    description:
      "Cotton clipping byproduct from garment cutting floor. Compressed bales, low contamination protocol.",
  },
  {
    title: "Industrial aluminum offcuts — 6061 mix",
    materialType: "Aluminum offcuts",
    unit: "MT",
    qty: [3, 15],
    description:
      "CNC and saw offcuts, oil-light, segregated by alloy where possible. Pickup from Oragadam plant.",
  },
  {
    title: "Corrugated carton waste — B-flute trim",
    materialType: "Corrugated paper waste",
    unit: "MT",
    qty: [10, 35],
    description:
      "Trim waste from packaging converter. Dry storage, no wax liners in this lot.",
  },
  {
    title: "Electronic component scrap — PCB depanel",
    materialType: "Electronic component scrap",
    unit: "kg",
    qty: [800, 3500],
    description:
      "Depanelized PCB trim and component fallout. Requires certified e-waste handling partner.",
  },
  {
    title: "Rubber conveyor section — operational surplus",
    materialType: "Rubber byproducts",
    unit: "MT",
    qty: [2, 9],
    description:
      "Surplus belt sections removed during line upgrade. Stored indoors, length varies.",
  },
  {
    title: "Industrial metal shavings — steel",
    materialType: "Industrial metal shavings",
    unit: "MT",
    qty: [6, 22],
    description:
      "Loose steel turnings from machining center. Skimmed coolant, ready for baling.",
  },
  {
    title: "PP regrind — homopolymer natural",
    materialType: "PP regrind",
    unit: "MT",
    qty: [4, 16],
    description:
      "In-house regrind, MFI tested batch. Color natural, suitable for non-food applications.",
  },
  {
    title: "Mixed ferrous scrap — punch press",
    materialType: "Mixed ferrous scrap",
    unit: "MT",
    qty: [15, 45],
    description:
      "Punch nest skeletons and offcuts. Periodic pickup cadence negotiable.",
  },
  {
    title: "Copper cable ends — harness production",
    materialType: "Copper cable ends",
    unit: "kg",
    qty: [200, 1200],
    description:
      "Clean cable end trim from harness line. Insulation segregated where feasible.",
  },
  {
    title: "LDPE film bales — stretch wrap grade",
    materialType: "LDPE film bales",
    unit: "MT",
    qty: [7, 20],
    description:
      "Post-industrial stretch film, baled. Low print, suitable for pelletizing.",
  },
  {
    title: "Cast iron borings — foundry line",
    materialType: "Cast iron borings",
    unit: "MT",
    qty: [9, 28],
    description:
      "Dry borings from machining of castings. Magnesium treatment not used on this line.",
  },
  {
    title: "ABS purge — ivory, injection grade",
    materialType: "ABS purge",
    unit: "MT",
    qty: [2, 8],
    description:
      "Startup purge and color-change material. Bagged in supersacks.",
  },
  {
    title: "Ceramic scrap — kiln furniture",
    materialType: "Ceramic scrap",
    unit: "MT",
    qty: [4, 12],
    description:
      "End-of-life kiln furniture and broken shelves. Industrial recovery only.",
  },
];

const OPERATIONAL_MESSAGES = [
  "Confirming pickup window for Tuesday 09:00–12:00 at our Guindy gate. Please share vehicle registration in advance.",
  "Quantity on file is approximate — we can reconcile at weighbridge. Target net weight within ±5%.",
  "Material is stored under cover; please bring tarps if rain is forecast for handoff day.",
  "Can you confirm your lifting equipment capacity? Bales are ~950 kg each.",
  "We need COA or photos of last lot received if you require tight contamination spec.",
  "Operational hold until our EHS sign-off completes — expected clearance by Thursday.",
  "Buyer to arrange transport; our loading bay available 08:00–16:00 IST only.",
  "Please confirm contact on site for security pass — name and mobile required 24h prior.",
  "Moisture reading last week was 0.8%; we can repeat test at pickup if required.",
  "Discussing partial lot release: 12 MT now, balance within 14 days if alignment holds.",
  "Quality sample retained 2 kg; balance available for pickup per agreed schedule.",
  "Updating you: line restart moved pickup to next week — will confirm exact slot Monday.",
];

const INTEREST_MESSAGES = [
  "We operate HDPE regrind capacity in Ambattur and can align on a trial lot.",
  "Interested in evaluating fit for our South India mandate — please confirm contamination protocol.",
  "Our procurement desk can move quickly if specs match our buyer network requirements.",
  "Requesting clarity on bale dimensions and stacking for transport planning.",
  "We have active demand in PET this month — interested in coordination subject to QC.",
  "Can discuss pickup cadence monthly if material stream is recurring.",
];

const INTEREST_TIMELINES = [
  "Pickup within 7–10 business days if terms align.",
  "Flexible on March second week — coordinate with our logistics partner.",
  "Urgent desk review — can respond with LOI outline within 48 hours.",
  "Prefer staged pickup if partial lots are acceptable.",
];

module.exports = {
  CHENNAI_LOCATIONS,
  PROVIDER_PROFILES,
  BUYER_PROFILES,
  MATERIAL_TEMPLATES,
  OPERATIONAL_MESSAGES,
  INTEREST_MESSAGES,
  INTEREST_TIMELINES,
};
