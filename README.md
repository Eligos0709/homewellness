# HomeWellness – Proactive Continuous Health Loop & Caregiver Agent

**HomeWellness** is an ambient, continuous physiological telemetry and proactive AI agent system designed for independent senior wellness. It bridges the gap between passive wearable sensor feeds (optical PPG, heart rate variability, SpO2) and empathetic, non-diagnostic caregiver coordination.

The platform simulates a real-time health loop between **Alice Smith** (an independent 74-year-old managing hypertension and mild arrhythmia risks) and her adult son and primary caregiver, **Bob Smith**.

---

## 🌟 Clinical & Real-World Value

Traditional consumer health wearables either overwhelm users with raw numbers or rely on static point-in-time scalar thresholds (e.g., alert triggered whenever $\text{HR} > 80\text{ bpm}$), resulting in frequent false alarms or alarm fatigue:

1. **Continuous Time-Series Dynamics Over Scalar Snapshots**:
   - Rather than treating vital readings as isolated snapshots, HomeWellness evaluates continuous sliding-window trajectories ($d(\text{bpm})/dt$, rolling EWMA mean, variance $\sigma$, and persistence duration $\tau$).
   - Differentiates transitory motion artifacts or momentary exertion spikes from sustained physiological instability, eliminating panic-inducing false alarms.

2. **Autonomous, Empathetic Voice Check-Ins**:
   - When anomalous heart rate acceleration is detected, the agent initiates an immediate, gentle voice check-in directly through the smartwatch speaker before escalating to family or emergency contacts.
   - Reassures the patient, assesses subjective symptoms (e.g., dizziness, shortness of breath), and instructs rest.

3. **Privacy-Preserving Caregiver Peace of Mind**:
   - Caregivers often balance work while worrying about an elderly parent living alone.
   - HomeWellness provides Bob with an asynchronous caregiver portal featuring chronological health trajectories, medication reminders, and a duplex AI chat—all gated by Alice’s explicit consent and privacy preferences.

4. **Strict "Non-Doctor" Clinical Boundary Policy**:
   - The AI agent operates with hardcoded safety guardrails: it **never** makes definitive medical diagnoses, prescribes treatments, or speculates on pathology.
   - All communicative outputs focus strictly on reassurance, non-strenuous posture advice, medication schedule adherence, and timely caregiver notification when persistent anomalies occur.

---

## 👥 Personas & Scenario Narrative

### Personas
- **Alice Smith (Patient / Wearer)**: 74 years old, lives independently. Medical history of mild hypertension. Prescribed daily evening medication (Metoprolol 25mg and Aspirin 81mg) scheduled at 19:00 UTC.
- **Bob Smith (Family Caregiver)**: Alice's adult son, busy working professional living 20 minutes away.
- **HomeWellness AI Agent**: Ambient health loop operating autonomously on Alice's wearable and cloud backend.

### Chronological Timeline (18:54 – 19:12 UTC)
- **18:54 UTC** — *Circadian Baseline*: Alice is sitting at the dining table preparing dinner. HR 65 bpm, HRV 15 ms, SpO2 95%, calm state.
- **18:55 UTC** — *Pre-Alert*: Scheduled medication reminder for 19:00 UTC loaded into watch memory.
- **18:56 UTC** — *Acute Ascent*: Heart rate ramps up rapidly ($+13\text{ bpm/min}$) to 78 bpm; warning banner activates on the smartwatch.
- **18:57 UTC** — *Transient Peak*: Heart rate peaks at 82 bpm, SpO2 93%. The HomeWellness agent initiates an autonomous voice check-in over the smartwatch. Alice reports slight shortness of breath after carrying groceries. The agent advises her to sit down and rest.
- **18:58 UTC** — *Vagal Recovery*: Heart rate decelerates rapidly back to normal 65 bpm. Warning changes to "Warn: HR back to normal".
- **18:59 – 19:01 UTC** — *Nominal Stabilization*: Heart rate stabilizes between 63–67 bpm. At 19:00 UTC, the medication reminder chimes.
- **19:02 UTC** — *Medication Adherence*: Alice takes her Metoprolol and Aspirin, confirming via voice check-in.
- **19:12 UTC** — *Caregiver Inquiry*: Bob finishes his workday and queries the HomeWellness duplex chat for an update on his mom's status.

---

## 🖥️ Application Features & How to Use

### 1. Smartwatch Timeline Carousel (Alice's View)
- **Interactive Wearable Hardware Simulation**:
  - Displays 9 high-fidelity Apple-Watch-style hardware casings complete with digital crown, side button, metallic bezels, and glass reflection.
  - Horizontal scroll track lets you navigate from 18:54 to 19:02 UTC using on-screen chevron arrows or trackpad gestures.
- **Dynamic Watch Face**:
  - **Warning / Status Banner**: Highlights active warnings (`Warn: HR abnormal`, `Warn: HR back to normal`) or medication alerts.
  - **Digital Clock**: Large, crisp time display. **Click any timestamp** to select that point in time and update the entire bottom telemetry console.
  - **Vitals Summary Card**: Color-coded card (cyan for normal, pink for abnormal) showing Resting HR, HRV, SpO2, and Sleep averages.
  - **Click to Talk Button**: Triggers the interactive smartwatch voice check-in modal.
  - **Medication Reminder**: Prominently displays the scheduled 19:00 prescription reminder.

### 2. Interactive Voice & Communication Block
- **Autonomous Voice Check-In**:
  - Simulates the bi-directional voice dialog between Alice and the HomeWellness agent.
  - Features real-time speech synthesis simulation, conversational audio test tone, and transcript playback.
- **Quick-Reply Prompts**:
  - Click quick-reply options (e.g., *"I'm resting at the dining table"*, *"Yes, I took both pills with water"*, *"I feel fine now, my heart slowed down"*) to see how the agent adapts its triage decisions.
- **Privacy Consent Toggle**:
  - Allows Alice to toggle: *"Allow HomeWellness to share vital telemetry & status updates with Bob Smith"*. When disabled, Bob's view reflects restricted access according to patient privacy rights.

### 3. Bob Smith Caregiver Portal
Toggle to **Bob Smith** via the identity switcher in the top right header:
- **Longitudinal Vitals Trajectory Ribbon**:
  - A comprehensive timeline ribbon tracking Alice from 18:54 through 19:12 UTC.
  - Displays instantaneous slopes ($d/dt$), trajectory classifications (`CIRCADIAN_STABLE`, `ACUTE_ASCENT`, `SUSTAINED_PEAK`, `VAGAL_DESCENT`), and rolling averages.
- **Proactive Alert Inbox**:
  - Lists real-time notifications dispatched to Bob's phone (e.g., the 18:57 heart rate spike and 19:02 medication confirmation).
  - Bob can acknowledge alerts with a single click.
- **Episodic Context & Memory Injector**:
  - Bob can input contextual notes (e.g., *"Mom had mild cold symptoms yesterday"*, *"Cardiologist adjusted beta-blocker dosage"*).
  - Injected memories are automatically indexed and synthesized into the agent's reasoning loop.
- **Duplex Interactive AI Chat**:
  - An intelligent caregiver chat interface where Bob can ask open-ended questions like *"How is Mom doing right now?"* or *"Did she remember her blood pressure medicine?"*.
  - The agent responds using grounded facts from Alice's telemetry, voice interactions, and injected memories.

### 4. Semantic System Log & Telemetry Console (Bottom Drawer)
Inspect the agent's internal reasoning across 4 dedicated tabs:
- **Tab 1: System Log & Decision Rationale**:
  - Step-by-step audit trail of sensor inputs, risk score calculations, decision rationale, and triggered actions.
- **Tab 2: Vital Trends & Time-Series Analytics**:
  - Deep-dive mathematical telemetry: Exponentially Weighted Moving Average (EWMA), rolling standard deviation $\sigma$, trend velocity $d(\text{bpm})/dt$, and anomaly persistence duration $\tau$.
- **Tab 3: Multi-Agent Orchestration**:
  - Visual breakdown of the active LangGraph nodes: State Reader, Trend Classifier, Guardrail Validator, and Notification Dispatcher.
- **Tab 4: Guardrails & Audit Trail**:
  - Compliance validation proving that non-doctor boundaries, HIPAA consent, and caregiver escalation rules were strictly followed.

### 5. LangGraph Architecture Drawer
- Click **"Agent Status: Continuous Health Loop Active"** in the top navigation bar.
- Opens an interactive visual Directed Acyclic Graph (DAG) illustrating the complete multi-agent pipeline:
  `PPG Sensor Buffer` ➔ `Temporal Velocity Classifier` ➔ `Episodic Memory / Context Aggregator` ➔ `Clinical Guardrails Validator` ➔ `Voice Check-In & Caregiver Dispatcher`.

---

## 🏗️ Technical Architecture & Data Model

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Component-driven UI with strict typing and modern React hooks |
| **Styling** | Tailwind CSS v4 | Clean Apple-inspired aesthetic, fluid flex layouts, and responsive design |
| **Icons** | Lucide React | High-clarity clinical and hardware iconography |
| **Build & Bundler** | Vite 8 + ESBuild | Ultra-fast development server and optimized production bundles |
| **Time-Series Math** | Custom Sampling Engine (`timeSeriesHelper.ts`) | Continuous PPG buffer downsampling, derivative calculations, and four-phase trajectory detection |
| **Agent State Machine** | LangGraph Architecture Pattern | Multi-node cyclical state machine with short-term buffers, episodic memory injection, and guardrails |

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js (v18.0 or higher recommended)
- npm or bun

### Installation & Run

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local development server**:
   ```bash
   npm run dev
   ```
   The application will start on `http://localhost:3000`.

3. **Validate TypeScript & Linting**:
   ```bash
   npm run lint
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔒 Clinical & Ethical Disclaimers
*HomeWellness is an educational prototype and conceptual simulation of ambient eldercare technology. It is not a certified medical device and does not provide clinical diagnosis or emergency medical dispatch. All health-related decisions should be made in consultation with qualified healthcare professionals.*
