import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./client";
import { narrativeBeats, narrativeChoices, choiceImpacts } from "./schema";

// ─── Beats ────────────────────────────────────────────────────────────────────

const beats = [
  {
    id: "beat_00",
    round: 0,
    orderIndex: 0,
    title: "The GHS 10,000 Moment",
    storyText:
      "Your room is small but your screen is bright. GHS 10,000 sits in your mobile money account — every pesewa earned through late nights, odd jobs, and stubborn saving.\n\nThe city outside your window is already moving. Accra doesn't pause for anyone. You've had this dream for a while. Now the money is real, and there are no more excuses.\n\nThe question isn't whether you're ready. The question is: what are you building?",
  },
  {
    id: "beat_01",
    round: 1,
    orderIndex: 1,
    title: "Choose Your Path",
    storyText:
      "Three ideas have been living rent-free in your head for months. You've researched them all, argued with yourself about each one, and lost sleep over the decision.\n\nTonight, you're committing. No more 'maybe.' No more 'let me think about it.' The GHS 10,000 is ready. Accra is waiting. Which bet are you placing?",
  },
  {
    id: "beat_02",
    round: 1,
    orderIndex: 2,
    title: "All In or Play It Safe?",
    storyText:
      "You've told two people about your venture. One hyped you up. The other asked if you had a 'backup plan.' Classic.\n\nNow comes your first real test: how do you deploy your capital? Go big early and make noise, or start lean and learn fast before you spend serious money?\n\nYou have GHS 10,000. Spend it wrong and this story ends before it starts.",
  },
  {
    id: "beat_03",
    round: 1,
    orderIndex: 3,
    title: "Your Network Calls",
    storyText:
      "Word travels fast. A course mate reaches out — they heard you're doing something and they want in. They're talented, energetic, and would work for equity.\n\nBut you've always moved faster alone. No meetings, no consensus, no 'let me check with my partner.' Just decisions.\n\nDo you bring them on board, or do you stay the sole captain of this ship?",
  },
  {
    id: "beat_04",
    round: 1,
    orderIndex: 4,
    title: "The Copycat Problem",
    storyText:
      "You post about your venture online and the response is... interesting. Three likes from friends, one rude comment, and — wait. Someone is literally copying your idea. Same concept, different name, posted two days after yours.\n\nYour instinct is to go off on them publicly. But maybe there's a smarter play here.\n\nHow do you respond?",
  },
  {
    id: "beat_05",
    round: 1,
    orderIndex: 5,
    title: "The Fuel Spike",
    storyText:
      "It's mid-month and the economy just reminded you it's in charge. Fuel prices jumped 18% overnight. For you, that means delivery costs are up, supplier prices are creeping, and your margin just got squeezed.\n\nYour customers haven't noticed yet. You could absorb the cost quietly — or get ahead of it now before it becomes a bigger problem.",
  },
  {
    id: "beat_06",
    round: 1,
    orderIndex: 6,
    title: "The Difficult First Customer",
    storyText:
      "Your first real paying customer is also your first real headache. They want changes, they want them fast, and they're not shy about it. They're also telling everyone they know about your business — for better or worse.\n\nYou could bend over backwards to keep them happy. Or set a firm boundary and risk losing them but keeping your sanity.",
  },
  {
    id: "beat_07",
    round: 1,
    orderIndex: 7,
    title: "A Small Win",
    storyText:
      "Something actually went right. A sale came through bigger than expected, a customer left a glowing review, or a connection paid off. It's not life-changing money — but it's proof the idea works.\n\nThe question is what you do with the momentum. Reinvest it immediately, or take a breath and plan your next move properly?",
  },
  {
    id: "beat_08",
    round: 1,
    orderIndex: 8,
    title: "The Nest Knocks",
    storyText:
      "A message lands in your inbox from the UGBS Innovation and Incubation Hub — The Nest. They're running a 3-day intensive workshop for early-stage founders. Mentors, networks, resources. The works.\n\nBut three days is three days. Your business doesn't run itself, and you're in the middle of a critical week. Do you pause to invest in yourself, or keep your head down and grind?",
  },
  {
    id: "beat_09",
    round: 1,
    orderIndex: 9,
    title: "The Cashflow Squeeze",
    storyText:
      "The numbers are looking tighter than you'd like. You're making sales but money isn't sitting in the account — it's cycling straight back into operations. A supplier wants payment early. A key expense just came up.\n\nYou could chase down a small informal loan from a family member to bridge the gap. Or cut costs hard and ride it out on what you have.",
  },
  {
    id: "beat_10",
    round: 1,
    orderIndex: 10,
    title: "End of Round 1 — Taking Stock",
    storyText:
      "One month in. You're still standing, which — honestly — not everyone can say.\n\nYou've made real decisions with real money. Some paid off. Some stung. The business is alive but it needs to grow. Round 2 is about pushing past 'surviving' into 'building something real.'\n\nBefore you step into it — what kind of founder are you going to be?",
  },
  {
    id: "beat_11",
    round: 2,
    orderIndex: 1,
    title: "New Month, Higher Stakes",
    storyText:
      "Month two. The honeymoon phase is over and the real work begins. You have traction but you also have a clearer picture of what's broken.\n\nYou could fix the fundamentals — tighten operations, plug the leaks. Or you could push forward and bet that growth solves the problems. It sometimes does. It sometimes doesn't.",
  },
  {
    id: "beat_12",
    round: 2,
    orderIndex: 2,
    title: "Scale Up or Stay Small?",
    storyText:
      "You're getting more demand than you can handle comfortably. Good problem to have — except it's still a problem. You could expand capacity now and take on more volume. But scaling too fast has killed plenty of promising businesses.\n\nStay lean and controlled, or stretch for the bigger opportunity?",
  },
  {
    id: "beat_13",
    round: 2,
    orderIndex: 3,
    title: "The Partnership Offer",
    storyText:
      "Someone with an established audience and customer base wants to partner. They bring distribution, you bring the product or service. On paper it sounds clean.\n\nBut partnerships are relationships, and relationships are complicated. You'd be giving up some control. And what if their brand doesn't align with yours long-term?",
  },
  {
    id: "beat_14",
    round: 2,
    orderIndex: 4,
    title: "The Big Player Moves In",
    storyText:
      "A well-funded competitor just entered your space. They have more capital, more staff, and a recognizable name. People are already talking about them.\n\nYou can't out-spend them. But can you out-think them? Do you compete head-on and fight for your customers, or find a niche they can't reach?",
  },
  {
    id: "beat_15",
    round: 2,
    orderIndex: 5,
    title: "Lights Out",
    storyText:
      "ECG has entered the chat. Load shedding hits hard this week — six hours a day, no warning. If your operations depend on power (and whose don't?), this is a real problem.\n\nDo you invest in a backup power solution — a cost you hadn't planned for — or find a creative workaround that keeps things moving for free?",
  },
  {
    id: "beat_16",
    round: 2,
    orderIndex: 6,
    title: "Do You Hire?",
    storyText:
      "You're doing too much. Sales, operations, customer service, admin — it's all you, all the time. You're not burning out yet but you can feel it coming.\n\nHiring means cost but also capacity. The right person could unlock the next level. The wrong one could drain you. Do you bring someone in, or find a way to systemize and stay lean?",
  },
  {
    id: "beat_17",
    round: 2,
    orderIndex: 7,
    title: "The Pitch Competition",
    storyText:
      "The Nest is hosting a pitch competition. GHS 5,000 prize, plus mentorship and visibility. You'd be going up against more polished founders — some with slide decks that look like they cost more than your entire capital.\n\nEntering means time away from operations to prepare. But winning — or even placing — could change your trajectory completely.",
  },
  {
    id: "beat_18",
    round: 2,
    orderIndex: 8,
    title: "The Market Shifts",
    storyText:
      "Something is changing in your market. Customer behavior, a new trend, a shift in what people actually want. Your original plan was built for the old reality.\n\nDo you adapt — pivot some part of your offering to meet the moment — or stay the course and trust your original vision?",
  },
  {
    id: "beat_19",
    round: 2,
    orderIndex: 9,
    title: "The Loan Decision",
    storyText:
      "A microfinance institution is offering small business loans at 18% interest. Your capital is running lower than you'd like and there's a clear opportunity in front of you that needs funding.\n\nDebt is leverage. But debt is also pressure. Do you take the loan and move fast, or find another way to fund the opportunity?",
  },
  {
    id: "beat_20",
    round: 2,
    orderIndex: 10,
    title: "End of Round 2 — The Business is Real",
    storyText:
      "Two months in. The business isn't a side project anymore — it's a real thing with real customers, real costs, and real stakes.\n\nYou've made harder decisions than you expected. Some came naturally. Some kept you up at night. Round 3 is where it all converges — the final chapter of your first venture.\n\nHow you finish will define what kind of founder you become.",
  },
  {
    id: "beat_21",
    round: 3,
    orderIndex: 1,
    title: "The Final Chapter Begins",
    storyText:
      "Month three. This is it — the stretch run. The decisions you make now will determine whether this venture becomes something lasting or a hard, expensive lesson.\n\nYou could attack the final stretch aggressively — push hard, take risks, go for broke. Or you could play it smart — consolidate what you've built and finish strong.",
  },
  {
    id: "beat_22",
    round: 3,
    orderIndex: 2,
    title: "The Crisis",
    storyText:
      "Something went wrong. A key supplier bailed. A product batch failed. A misunderstanding with a client blew up publicly. Whatever it is — it's bad, it's public, and people are watching how you handle it.\n\nPanic is not a strategy. But neither is silence. How you respond right now will tell everyone — including yourself — who you really are.",
  },
  {
    id: "beat_23",
    round: 3,
    orderIndex: 3,
    title: "The Unlikely Ally",
    storyText:
      "Out of nowhere, someone offers to help. Maybe it's a more established entrepreneur who's been watching your journey. Maybe it's a former competitor. Whatever the history — they have resources you need and they're genuinely extending a hand.\n\nDo you accept the help, or does accepting feel like admitting you can't do it alone?",
  },
  {
    id: "beat_24",
    round: 3,
    orderIndex: 4,
    title: "The Shortcut",
    storyText:
      "There's a faster path in front of you. Maybe it means cutting a corner on quality, overpromising to a client, or exploiting a loophole your competitors haven't noticed yet.\n\nIt would probably work. At least short-term. But what does it cost you — your reputation, your integrity, your ability to sleep at night?",
  },
  {
    id: "beat_25",
    round: 3,
    orderIndex: 5,
    title: "The Media Moment",
    storyText:
      "A journalist covering Ghana's youth entrepreneurship scene wants to feature you. It would be your first real media exposure — potential reach of thousands.\n\nBut the feature goes out next week, and honestly, your story isn't perfectly polished yet. There are parts you're not proud of. Do you go for it, or wait until the story is cleaner?",
  },
  {
    id: "beat_26",
    round: 3,
    orderIndex: 6,
    title: "The Rival Strikes",
    storyText:
      "Your most aggressive competitor just poached one of your key contacts and is openly undercutting your prices. They're sending a message: they're coming for your customers.\n\nYou could match them — enter a price war and bleed together. Or you could refuse to play their game and compete on value instead.",
  },
  {
    id: "beat_27",
    round: 3,
    orderIndex: 7,
    title: "The Big Offer",
    storyText:
      "Someone wants to acquire a stake in your business — or bring you under a larger umbrella. The offer is real money. More than you expected at this stage.\n\nBut this is your thing. You built it from GHS 10,000 and a room full of late nights. Selling a piece of it changes the game entirely. Do you take the deal or double down on your own?",
  },
  {
    id: "beat_28",
    round: 3,
    orderIndex: 8,
    title: "The Community Asks",
    storyText:
      "A community initiative reaches out. They want your involvement — mentoring young students, donating a portion of proceeds, or lending your brand to a cause. It's meaningful. But it costs time and money you're not sure you have.\n\nDo you give back now while you're still building, or wait until you're in a stronger position?",
  },
  {
    id: "beat_29",
    round: 3,
    orderIndex: 9,
    title: "The Final Push",
    storyText:
      "This is your last move. Everything you've built, every decision you've made, every late night and early morning — it's all come down to this.\n\nYou have one final call to make. Go all in on the boldest version of your vision, or lock in what you've built and call it a solid first chapter?\n\nThere's no wrong answer. Only your answer.",
  },
  {
    id: "beat_30",
    round: 3,
    orderIndex: 10,
    title: "The Reckoning",
    storyText:
      "The dust settles. The numbers are in. Three months, GHS 10,000, and more decisions than you can count.\n\nYou came in with capital and a dream. What you leave with is something more valuable: a real understanding of who you are as an entrepreneur. Your instincts, your blind spots, your strengths under pressure.\n\nThe city is still moving. And now — so are you.",
  },
];

// ─── Choices ──────────────────────────────────────────────────────────────────

const choices = [
  // beat_00 — The GHS 10,000 Moment (venture selection — merged from beat_01)
  { id: "beat_01_a", beatId: "beat_00", nextBeatId: "beat_02", label: "Urban Threads — The streets need better style. I'm giving it to them.", immediateFeedback: "Fashion and hustle. You're betting on your eye for style and the city's appetite for it. The Kantamanto runs are about to become your second home." },
  { id: "beat_01_b", beatId: "beat_00", nextBeatId: "beat_02", label: "Campus Kitchen — The food situation is a crime. I'm fixing it.", immediateFeedback: "Food is the most honest business there is. People eat every day. You're betting on quality and consistency — and the fact that hunger never takes a day off." },
  { id: "beat_01_c", beatId: "beat_00", nextBeatId: "beat_02", label: "Digital Solve — Local businesses are stuck offline. I'm dragging them forward.", immediateFeedback: "You're selling something most people know they need but don't know how to get. That's a powerful position — if you can close the gap between awareness and action." },

  // beat_02 — All In or Play It Safe?
  { id: "beat_02_a", beatId: "beat_02", nextBeatId: "beat_03", label: "Go big. Spend GHS 4,000 upfront. Make a statement.", immediateFeedback: "Bold move. You're putting real skin in the game early. The market will notice — and so will you when the pressure is on to make it back." },
  { id: "beat_02_b", beatId: "beat_02", nextBeatId: "beat_03", label: "Start lean. GHS 1,500 only. Test before you commit.", immediateFeedback: "Disciplined. You're buying information before you buy inventory. The runway stays long while you figure out what actually works." },

  // beat_03 — Your Network Calls
  { id: "beat_03_a", beatId: "beat_03", nextBeatId: "beat_04", label: "Bring them in. Two heads, shared load, shared reward.", immediateFeedback: "You've got backup now. The weight halves but so does the ownership. Make sure expectations are crystal clear from day one." },
  { id: "beat_03_b", beatId: "beat_03", nextBeatId: "beat_04", label: "Stay solo. You move faster alone.", immediateFeedback: "Your call, your pace. No committees, no compromise. Just make sure you don't become the bottleneck when things pick up." },

  // beat_04 — The Copycat Problem
  { id: "beat_04_a", beatId: "beat_04", nextBeatId: "beat_05", label: "Call them out publicly. Let the market know who was first.", immediateFeedback: "You drew a line. Some people respect that. Just make sure your execution speaks louder than the drama — the market rewards quality, not just priority." },
  { id: "beat_04_b", beatId: "beat_04", nextBeatId: "beat_05", label: "Ignore them. Focus on being so good they become irrelevant.", immediateFeedback: "The best revenge is execution. You stayed in your lane and kept building. Let the product do the talking." },

  // beat_05 — The Fuel Spike
  { id: "beat_05_a", beatId: "beat_05", nextBeatId: "beat_06", label: "Raise prices now. Protect your margin before it disappears.", immediateFeedback: "Proactive move. Some customers will grumble but a business with no margin is a hobby, not a company. You protected the fundamentals." },
  { id: "beat_05_b", beatId: "beat_05", nextBeatId: "beat_06", label: "Absorb the cost for now. Keep customers happy and revisit later.", immediateFeedback: "Short-term goodwill, long-term pressure. You bought loyalty but the squeeze is real. You'll need to find that margin somewhere else." },

  // beat_06 — Difficult First Customer
  { id: "beat_06_a", beatId: "beat_06", nextBeatId: "beat_07", label: "Give them everything they want. First customers set the tone.", immediateFeedback: "They're happy. For now. But you've set an expectation that might be hard to walk back. Watch what you've normalized." },
  { id: "beat_06_b", beatId: "beat_06", nextBeatId: "beat_07", label: "Set a clear boundary. Deliver the agreement, nothing more.", immediateFeedback: "Respect earned. Difficult customers often become the most loyal when they realize you have standards. Or they leave — and that's okay too." },

  // beat_07 — A Small Win
  { id: "beat_07_a", beatId: "beat_07", nextBeatId: "beat_08", label: "Reinvest immediately. Stack the momentum.", immediateFeedback: "You're compounding. Every win feeds the next move. Just keep an eye on the fundamentals — momentum is powerful but it can mask problems." },
  { id: "beat_07_b", beatId: "beat_07", nextBeatId: "beat_08", label: "Pause and plan. Make the next move deliberately.", immediateFeedback: "Strategic. You're building with intention, not just speed. The win was real but the next one needs to be bigger — and you know why." },

  // beat_08 — The Nest Knocks
  { id: "beat_08_a", beatId: "beat_08", nextBeatId: "beat_09", label: "Attend the workshop. The network and mentorship are worth it.", immediateFeedback: "Three days of the right conversations can save three months of wrong decisions. You invested in yourself — now make sure you use what you learn." },
  { id: "beat_08_b", beatId: "beat_08", nextBeatId: "beat_09", label: "Skip it. The business needs you right now.", immediateFeedback: "The grind continues. You stayed focused — just make sure you're not confusing busyness with progress. Find mentorship another way." },

  // beat_09 — The Cashflow Squeeze
  { id: "beat_09_a", beatId: "beat_09", nextBeatId: "beat_10", label: "Borrow to bridge the gap. Keep operations smooth.", immediateFeedback: "The gap is covered. But debt — even informal debt — is pressure. Pay it back fast and don't make it a habit." },
  { id: "beat_09_b", beatId: "beat_09", nextBeatId: "beat_10", label: "Cut costs hard and ride it out.", immediateFeedback: "Lean and alive. You tightened the belt and made it through. The discipline is real — and so is the lesson about cashflow management." },

  // beat_10 — End of Round 1
  { id: "beat_10_a", beatId: "beat_10", nextBeatId: "beat_11", label: "I'm going to be bolder. Round 2 is about taking bigger swings.", immediateFeedback: "Noted. Round 2 will test whether boldness is backed by preparation or just adrenaline. Both can work — for a while." },
  { id: "beat_10_b", beatId: "beat_10", nextBeatId: "beat_11", label: "I'm going to be smarter. Build systems, reduce chaos.", immediateFeedback: "Good instinct. The founders who survive aren't always the most aggressive — they're the ones who build machines, not just products." },

  // beat_11 — New Month, Higher Stakes
  { id: "beat_11_a", beatId: "beat_11", nextBeatId: "beat_12", label: "Push forward. Growth solves most problems.", immediateFeedback: "Aggressive and true — sometimes. Growth covers cracks but it also makes them bigger if they're structural. Eyes open." },
  { id: "beat_11_b", beatId: "beat_11", nextBeatId: "beat_12", label: "Fix the fundamentals first. Build on solid ground.", immediateFeedback: "Methodical. You're slowing down to speed up. The foundation you lay now will determine how high you can build later." },

  // beat_12 — Scale Up or Stay Small?
  { id: "beat_12_a", beatId: "beat_12", nextBeatId: "beat_13", label: "Expand now. Take on more volume and grow into it.", immediateFeedback: "You're stretching. It's uncomfortable and exciting in equal measure. Make sure the quality holds as the quantity grows." },
  { id: "beat_12_b", beatId: "beat_12", nextBeatId: "beat_13", label: "Stay lean. Control the quality before you scale it.", immediateFeedback: "Disciplined restraint. You know that a bigger version of a broken system is just a bigger broken system." },

  // beat_13 — The Partnership Offer
  { id: "beat_13_a", beatId: "beat_13", nextBeatId: "beat_14", label: "Take the partnership. Distribution and reach matter now.", immediateFeedback: "You traded some control for reach. Smart — if the values align. Keep the terms in writing and the communication constant." },
  { id: "beat_13_b", beatId: "beat_13", nextBeatId: "beat_14", label: "Pass on it. You build your own distribution.", immediateFeedback: "Harder path, full ownership. You're betting on yourself to crack the distribution challenge. Respect — but get it done." },

  // beat_14 — The Big Player Moves In
  { id: "beat_14_a", beatId: "beat_14", nextBeatId: "beat_15", label: "Compete head-on. Fight for every customer.", immediateFeedback: "You're in the ring. It's going to hurt. But sometimes the best way to grow is to be tested by the best in the room." },
  { id: "beat_14_b", beatId: "beat_14", nextBeatId: "beat_15", label: "Find a niche they can't reach. Be specific where they're broad.", immediateFeedback: "Smart positioning. You found the gap in their armor. Big players are slow and generic — you can be fast and precise." },

  // beat_15 — Lights Out
  { id: "beat_15_a", beatId: "beat_15", nextBeatId: "beat_16", label: "Invest in a backup power solution. Remove the dependency.", immediateFeedback: "GHS out, problem solved. You bought reliability — and in a market with erratic power, reliability is a competitive advantage." },
  { id: "beat_15_b", beatId: "beat_15", nextBeatId: "beat_16", label: "Find a creative workaround. Adapt without spending.", immediateFeedback: "Resourceful. You found a way. It's not perfect but it works — and finding non-obvious solutions is a founder's superpower." },

  // beat_16 — Do You Hire?
  { id: "beat_16_a", beatId: "beat_16", nextBeatId: "beat_17", label: "Hire someone. Buy back your time and capacity.", immediateFeedback: "Your first hire. The business just got bigger and more complicated simultaneously. Invest in onboarding them properly — shortcuts here cost you later." },
  { id: "beat_16_b", beatId: "beat_16", nextBeatId: "beat_17", label: "Systemize instead. Build processes that reduce your load.", immediateFeedback: "You chose systems over headcount. Smart and scalable — if you actually build the systems. Don't use this as an excuse to stay comfortable." },

  // beat_17 — The Pitch Competition
  { id: "beat_17_a", beatId: "beat_17", nextBeatId: "beat_18", label: "Enter the competition. The visibility is worth the preparation.", immediateFeedback: "You put yourself out there. Whether you win or not, you've practiced your story and met people who matter. That has value money can't buy." },
  { id: "beat_17_b", beatId: "beat_17", nextBeatId: "beat_18", label: "Skip it. The business needs focus right now.", immediateFeedback: "You stayed heads-down. The grind is real. Just make sure you're not hiding behind 'focus' to avoid the vulnerability of being seen and judged." },

  // beat_18 — The Market Shifts
  { id: "beat_18_a", beatId: "beat_18", nextBeatId: "beat_19", label: "Adapt. Pivot part of the offering to meet the moment.", immediateFeedback: "You read the room and moved. That's not weakness — that's intelligence. The best founders aren't the most stubborn; they're the most perceptive." },
  { id: "beat_18_b", beatId: "beat_18", nextBeatId: "beat_19", label: "Stay the course. Your original vision was right.", immediateFeedback: "Conviction is powerful. Just make sure you're not confusing stubbornness with vision. Check the data. Then decide." },

  // beat_19 — The Loan Decision
  { id: "beat_19_a", beatId: "beat_19", nextBeatId: "beat_20", label: "Take the loan. Use leverage to move faster.", immediateFeedback: "Debt activated. The clock is ticking at 18%. Make sure the opportunity you're funding can outrun the interest. The math has to work." },
  { id: "beat_19_b", beatId: "beat_19", nextBeatId: "beat_20", label: "No loan. Find another way to fund the opportunity.", immediateFeedback: "Debt-free and creative. You found — or will find — another route. It might be slower but you're not paying 18% for the privilege." },

  // beat_20 — End of Round 2
  { id: "beat_20_a", beatId: "beat_20", nextBeatId: "beat_21", label: "I want to finish big. Round 3 is about legacy.", immediateFeedback: "Legacy thinking at month three. Bold. Make sure the foundation can support the ambition — then go for it." },
  { id: "beat_20_b", beatId: "beat_20", nextBeatId: "beat_21", label: "I want to finish smart. Secure the gains and build forward.", immediateFeedback: "Sustainable ambition. You're building something that lasts, not just something that pops. That's the harder and more important skill." },

  // beat_21 — The Final Chapter Begins
  { id: "beat_21_a", beatId: "beat_21", nextBeatId: "beat_22", label: "Attack. Full aggression in the final stretch.", immediateFeedback: "Everything forward. The energy is infectious — just make sure the strategy underneath the aggression is sound." },
  { id: "beat_21_b", beatId: "beat_21", nextBeatId: "beat_22", label: "Consolidate. Protect what's been built and grow deliberately.", immediateFeedback: "Measured. You're finishing the race, not sprinting through a wall. Smart money is on the founder who knows when to push and when to preserve." },

  // beat_22 — The Crisis
  { id: "beat_22_a", beatId: "beat_22", nextBeatId: "beat_23", label: "Address it publicly and immediately. Own the narrative.", immediateFeedback: "Accountability is rare and respected. You didn't hide. That takes courage — and it builds the kind of trust that outlasts any crisis." },
  { id: "beat_22_b", beatId: "beat_22", nextBeatId: "beat_23", label: "Handle it quietly. Fix the problem without broadcasting it.", immediateFeedback: "Contained. Sometimes discretion is the right call. Just make sure the fix is real — quiet problems that aren't solved have a way of getting loud." },

  // beat_23 — The Unlikely Ally
  { id: "beat_23_a", beatId: "beat_23", nextBeatId: "beat_24", label: "Accept the help. Good support doesn't care about the source.", immediateFeedback: "Humble and smart. The best founders know they didn't build alone. You let someone in — now make the most of it." },
  { id: "beat_23_b", beatId: "beat_23", nextBeatId: "beat_24", label: "Decline. You finish this the way you started it.", immediateFeedback: "Independent to the end. There's pride in that. Just make sure the pride is serving the business and not the other way around." },

  // beat_24 — The Shortcut
  { id: "beat_24_a", beatId: "beat_24", nextBeatId: "beat_25", label: "Take the shortcut. Speed matters more right now.", immediateFeedback: "Faster path taken. It worked — this time. But shortcuts have a compounding cost. The next one will be easier to justify. Watch that." },
  { id: "beat_24_b", beatId: "beat_24", nextBeatId: "beat_25", label: "Ignore it. Play the long game with your integrity intact.", immediateFeedback: "You left the easy path alone. That's character — and in business, character is infrastructure. It holds everything else up." },

  // beat_25 — The Media Moment
  { id: "beat_25_a", beatId: "beat_25", nextBeatId: "beat_26", label: "Say yes. Imperfect visibility beats perfect invisibility.", immediateFeedback: "You showed up before you were ready — which is basically the definition of entrepreneurship. The story is out there. Now go make it better." },
  { id: "beat_25_b", beatId: "beat_25", nextBeatId: "beat_26", label: "Not yet. Wait until the story is worth telling.", immediateFeedback: "Patience. You want the narrative to be right. Just don't let 'not ready' become a permanent address." },

  // beat_26 — The Rival Strikes
  { id: "beat_26_a", beatId: "beat_26", nextBeatId: "beat_27", label: "Match their prices. Win the customer, worry about margin later.", immediateFeedback: "Price war engaged. You're in the trenches. Just know that races to the bottom have no winners — only survivors who forgot why they started." },
  { id: "beat_26_b", beatId: "beat_26", nextBeatId: "beat_27", label: "Hold your price. Compete on value, not on cost.", immediateFeedback: "You refused to be dragged down. Not everyone will stay — but the ones who do are the customers worth having." },

  // beat_27 — The Big Offer
  { id: "beat_27_a", beatId: "beat_27", nextBeatId: "beat_28", label: "Take the deal. Real money on the table is real money.", immediateFeedback: "Capital secured, ownership diluted. You made a business decision, not a vanity decision. Whether it was right depends on what you do next." },
  { id: "beat_27_b", beatId: "beat_27", nextBeatId: "beat_28", label: "Decline. This is yours. You're not selling the vision.", immediateFeedback: "All in on yourself. Respect. Now you have to make the bet pay off — because you just passed on a real exit." },

  // beat_28 — The Community Asks
  { id: "beat_28_a", beatId: "beat_28", nextBeatId: "beat_29", label: "Give back now. Business and community aren't separate.", immediateFeedback: "You made it mean something. The investment in community often returns in ways that don't show up on a balance sheet — but matter just as much." },
  { id: "beat_28_b", beatId: "beat_28", nextBeatId: "beat_29", label: "Not now. Build the business first, give back from a position of strength.", immediateFeedback: "Pragmatic. You can't pour from an empty cup. Just make sure 'not now' has a real 'then' attached to it." },

  // beat_29 — The Final Push
  { id: "beat_29_a", beatId: "beat_29", nextBeatId: "beat_30", label: "Go all in. Boldest version of the vision. Full send.", immediateFeedback: "Everything on the table. Whatever happens next, no one can say you didn't commit. The reckoning is coming — and you're ready for it." },
  { id: "beat_29_b", beatId: "beat_29", nextBeatId: "beat_30", label: "Lock it in. Protect what's been built. Finish strong.", immediateFeedback: "Smart close. You built something real and you protected it. That's a W — even if it's not the loudest one in the room." },
];

// ─── Choice Impacts ───────────────────────────────────────────────────────────

const impacts: (typeof choiceImpacts.$inferInsert)[] = [
  // beat_01 — path selection sets venture flags, no capital cost
  { choiceId: "beat_01_a", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.3, flagUpdates: { venture_threads: true } },
  { choiceId: "beat_01_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.2, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.1, flagUpdates: { venture_kitchen: true } },
  { choiceId: "beat_01_c", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.2, innovativenessDelta: 0.3, proactivenessDelta: 0.2, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: { venture_digital: true } },

  // beat_02 — go big vs lean start
  { choiceId: "beat_02_a", capitalDelta: -4000, reputationDelta: 2, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },
  { choiceId: "beat_02_b", capitalDelta: -1500, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.3, innovativenessDelta: 0.2, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0, flagUpdates: {} },

  // beat_03 — network vs solo
  { choiceId: "beat_03_a", capitalDelta: 0, reputationDelta: 1, networkDelta: 10, momentumDelta: 0.05, autonomyDelta: 0, innovativenessDelta: 0.1, proactivenessDelta: 0.2, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.3, flagUpdates: { has_cofounder: true } },
  { choiceId: "beat_03_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.4, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_04 — copycat response
  { choiceId: "beat_04_a", capitalDelta: 0, reputationDelta: -2, networkDelta: 2, momentumDelta: 0, autonomyDelta: 0.1, innovativenessDelta: 0, proactivenessDelta: 0.2, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.4, flagUpdates: {} },
  { choiceId: "beat_04_b", capitalDelta: 0, reputationDelta: 3, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.3, innovativenessDelta: 0.3, proactivenessDelta: 0.1, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0, flagUpdates: {} },

  // beat_05 — fuel spike
  { choiceId: "beat_05_a", capitalDelta: 0, reputationDelta: -1, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.2, innovativenessDelta: 0, proactivenessDelta: 0.4, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },
  { choiceId: "beat_05_b", capitalDelta: -500, reputationDelta: 3, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_06 — difficult customer
  { choiceId: "beat_06_a", capitalDelta: 0, reputationDelta: 4, networkDelta: 3, momentumDelta: 0, autonomyDelta: 0, innovativenessDelta: 0.1, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },
  { choiceId: "beat_06_b", capitalDelta: 0, reputationDelta: 2, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.4, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_07 — small win
  { choiceId: "beat_07_a", capitalDelta: 1500, reputationDelta: 2, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },
  { choiceId: "beat_07_b", capitalDelta: 500, reputationDelta: 1, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.3, innovativenessDelta: 0.3, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0, flagUpdates: {} },

  // beat_08 — the nest
  { choiceId: "beat_08_a", capitalDelta: -300, reputationDelta: 5, networkDelta: 15, momentumDelta: 0.05, autonomyDelta: 0.2, innovativenessDelta: 0.2, proactivenessDelta: 0.4, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: { attended_nest: true } },
  { choiceId: "beat_08_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.4, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_09 — cashflow squeeze
  { choiceId: "beat_09_a", capitalDelta: 2000, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.2, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.2, flagUpdates: { hasDebt: true } },
  { choiceId: "beat_09_b", capitalDelta: -800, reputationDelta: 0, networkDelta: 0, momentumDelta: -0.05, autonomyDelta: 0.4, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_10 — end of round 1
  { choiceId: "beat_10_a", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.3, flagUpdates: {} },
  { choiceId: "beat_10_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.4, innovativenessDelta: 0.3, proactivenessDelta: 0.4, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_11 — new month
  { choiceId: "beat_11_a", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.3, flagUpdates: {} },
  { choiceId: "beat_11_b", capitalDelta: 0, reputationDelta: 2, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.3, innovativenessDelta: 0.2, proactivenessDelta: 0.4, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_12 — scale up or stay small
  { choiceId: "beat_12_a", capitalDelta: -3000, reputationDelta: 3, networkDelta: 5, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.3, flagUpdates: { scaled_up: true } },
  { choiceId: "beat_12_b", capitalDelta: 0, reputationDelta: 1, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.4, innovativenessDelta: 0.3, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_13 — partnership offer
  { choiceId: "beat_13_a", capitalDelta: 2000, reputationDelta: 5, networkDelta: 20, momentumDelta: 0.1, autonomyDelta: 0, innovativenessDelta: 0.2, proactivenessDelta: 0.3, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.4, flagUpdates: { has_partner: true } },
  { choiceId: "beat_13_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.5, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_14 — big player moves in
  { choiceId: "beat_14_a", capitalDelta: -1000, reputationDelta: 3, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.2, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.5, flagUpdates: {} },
  { choiceId: "beat_14_b", capitalDelta: 0, reputationDelta: 2, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.3, innovativenessDelta: 0.5, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_15 — lights out
  { choiceId: "beat_15_a", capitalDelta: -2000, reputationDelta: 3, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.2, innovativenessDelta: 0.2, proactivenessDelta: 0.5, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: { has_backup_power: true } },
  { choiceId: "beat_15_b", capitalDelta: 0, reputationDelta: 1, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.3, innovativenessDelta: 0.5, proactivenessDelta: 0.3, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_16 — do you hire
  { choiceId: "beat_16_a", capitalDelta: -1500, reputationDelta: 0, networkDelta: 5, momentumDelta: 0.1, autonomyDelta: 0, innovativenessDelta: 0.2, proactivenessDelta: 0.3, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.4, flagUpdates: { hiredTeam: true } },
  { choiceId: "beat_16_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.5, innovativenessDelta: 0.3, proactivenessDelta: 0.4, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_17 — pitch competition
  { choiceId: "beat_17_a", capitalDelta: 2000, reputationDelta: 10, networkDelta: 15, momentumDelta: 0.1, autonomyDelta: 0.2, innovativenessDelta: 0.3, proactivenessDelta: 0.5, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.3, flagUpdates: { pitched_nest: true } },
  { choiceId: "beat_17_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.4, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_18 — market shifts
  { choiceId: "beat_18_a", capitalDelta: -500, reputationDelta: 2, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.2, innovativenessDelta: 0.5, proactivenessDelta: 0.4, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: { pivoted: true } },
  { choiceId: "beat_18_b", capitalDelta: 0, reputationDelta: 1, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.5, innovativenessDelta: 0.1, proactivenessDelta: 0.1, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_19 — loan decision
  { choiceId: "beat_19_a", capitalDelta: 5000, reputationDelta: 0, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.2, proactivenessDelta: 0.3, riskTakingDelta: 0.5, competitiveAggressivenessDelta: 0.3, flagUpdates: { hasDebt: true } },
  { choiceId: "beat_19_b", capitalDelta: 0, reputationDelta: 2, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.5, innovativenessDelta: 0.4, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_20 — end of round 2
  { choiceId: "beat_20_a", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.2, innovativenessDelta: 0.3, proactivenessDelta: 0.3, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.4, flagUpdates: {} },
  { choiceId: "beat_20_b", capitalDelta: 0, reputationDelta: 2, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.4, innovativenessDelta: 0.3, proactivenessDelta: 0.4, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_21 — final chapter
  { choiceId: "beat_21_a", capitalDelta: -1000, reputationDelta: 0, networkDelta: 0, momentumDelta: 0.15, autonomyDelta: 0.2, innovativenessDelta: 0.3, proactivenessDelta: 0.3, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.5, flagUpdates: {} },
  { choiceId: "beat_21_b", capitalDelta: 0, reputationDelta: 2, networkDelta: 0, momentumDelta: 0.05, autonomyDelta: 0.5, innovativenessDelta: 0.2, proactivenessDelta: 0.4, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_22 — the crisis
  { choiceId: "beat_22_a", capitalDelta: -500, reputationDelta: 8, networkDelta: 5, momentumDelta: 0, autonomyDelta: 0.3, innovativenessDelta: 0.2, proactivenessDelta: 0.4, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.3, flagUpdates: { handled_crisis_publicly: true } },
  { choiceId: "beat_22_b", capitalDelta: -200, reputationDelta: 2, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.4, innovativenessDelta: 0.3, proactivenessDelta: 0.2, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_23 — unlikely ally
  { choiceId: "beat_23_a", capitalDelta: 3000, reputationDelta: 5, networkDelta: 15, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.3, proactivenessDelta: 0.3, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.4, flagUpdates: { accepted_ally: true } },
  { choiceId: "beat_23_b", capitalDelta: 0, reputationDelta: 3, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.6, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_24 — the shortcut
  { choiceId: "beat_24_a", capitalDelta: 2000, reputationDelta: -5, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.2, riskTakingDelta: 0.5, competitiveAggressivenessDelta: 0.4, flagUpdates: { took_shortcut: true } },
  { choiceId: "beat_24_b", capitalDelta: 0, reputationDelta: 6, networkDelta: 3, momentumDelta: 0.05, autonomyDelta: 0.5, innovativenessDelta: 0.3, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_25 — media moment
  { choiceId: "beat_25_a", capitalDelta: 0, reputationDelta: 12, networkDelta: 20, momentumDelta: 0.1, autonomyDelta: 0.2, innovativenessDelta: 0.4, proactivenessDelta: 0.5, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.3, flagUpdates: { got_press: true } },
  { choiceId: "beat_25_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.4, innovativenessDelta: 0.2, proactivenessDelta: 0.1, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.1, flagUpdates: {} },

  // beat_26 — rival strikes
  { choiceId: "beat_26_a", capitalDelta: -1000, reputationDelta: -2, networkDelta: 0, momentumDelta: -0.05, autonomyDelta: 0.1, innovativenessDelta: 0.1, proactivenessDelta: 0.2, riskTakingDelta: 0.3, competitiveAggressivenessDelta: 0.6, flagUpdates: {} },
  { choiceId: "beat_26_b", capitalDelta: 0, reputationDelta: 5, networkDelta: 3, momentumDelta: 0.05, autonomyDelta: 0.4, innovativenessDelta: 0.4, proactivenessDelta: 0.3, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_27 — the big offer
  { choiceId: "beat_27_a", capitalDelta: 8000, reputationDelta: 5, networkDelta: 10, momentumDelta: 0.1, autonomyDelta: 0, innovativenessDelta: 0.2, proactivenessDelta: 0.3, riskTakingDelta: 0.4, competitiveAggressivenessDelta: 0.4, flagUpdates: { took_investment: true } },
  { choiceId: "beat_27_b", capitalDelta: 0, reputationDelta: 3, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.7, innovativenessDelta: 0.3, proactivenessDelta: 0.2, riskTakingDelta: 0.5, competitiveAggressivenessDelta: 0.2, flagUpdates: {} },

  // beat_28 — community asks
  { choiceId: "beat_28_a", capitalDelta: -500, reputationDelta: 10, networkDelta: 10, momentumDelta: 0.05, autonomyDelta: 0.2, innovativenessDelta: 0.2, proactivenessDelta: 0.5, riskTakingDelta: 0.1, competitiveAggressivenessDelta: 0.2, flagUpdates: { gave_back: true } },
  { choiceId: "beat_28_b", capitalDelta: 0, reputationDelta: 0, networkDelta: 0, momentumDelta: 0, autonomyDelta: 0.3, innovativenessDelta: 0.2, proactivenessDelta: 0.2, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.3, flagUpdates: {} },

  // beat_29 — the final push
  { choiceId: "beat_29_a", capitalDelta: -2000, reputationDelta: 5, networkDelta: 5, momentumDelta: 0.2, autonomyDelta: 0.3, innovativenessDelta: 0.4, proactivenessDelta: 0.4, riskTakingDelta: 0.6, competitiveAggressivenessDelta: 0.5, flagUpdates: { final_push_bold: true } },
  { choiceId: "beat_29_b", capitalDelta: 1000, reputationDelta: 3, networkDelta: 0, momentumDelta: 0.1, autonomyDelta: 0.5, innovativenessDelta: 0.3, proactivenessDelta: 0.4, riskTakingDelta: 0.2, competitiveAggressivenessDelta: 0.2, flagUpdates: { final_push_safe: true } },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding narrative beats...");
  await db.insert(narrativeBeats).values(beats).onConflictDoNothing();
  console.log(`✓ ${beats.length} beats inserted`);

  console.log("🌱 Seeding narrative choices...");
  await db.insert(narrativeChoices).values(choices).onConflictDoNothing();
  console.log(`✓ ${choices.length} choices inserted`);

  console.log("🌱 Seeding choice impacts...");
  await db.insert(choiceImpacts).values(impacts).onConflictDoNothing();
  console.log(`✓ ${impacts.length} impacts inserted`);

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
