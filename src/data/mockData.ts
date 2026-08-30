import { Person, Group, Gathering, Task, Assignment, GroupMessage } from "../types";

export const initialPersons: Person[] = [
  {
    id: "person-1",
    name: "Kari Nordmann",
    phone: "912 34 567",
    email: "kari.nordmann@eksempel.no",
    globalRole: "admin",
  },
  {
    id: "person-2",
    name: "Ola Hansen",
    phone: "987 65 432",
    email: "ola.hansen@eksempel.no",
    globalRole: "member",
  },
  {
    id: "person-3",
    name: "Ingrid Berg",
    phone: "456 78 901",
    email: "ingrid.berg@eksempel.no",
    globalRole: "member",
  },
  {
    id: "person-4",
    name: "Jonas Lie",
    phone: "923 45 678",
    email: "jonas.lie@eksempel.no",
    globalRole: "member",
  },
];

export const initialGroups: Group[] = [
  {
    id: "group-lyd",
    name: "Lyd og bilde",
    category: "tjenestegruppe",
    memberIds: ["person-1", "person-2"],
    leaderIds: ["person-2"], // Ola Hansen is leader
    deputyLeaderIds: ["person-1"], // Kari Nordmann is deputy leader
    meetingSchedule: {
      weekday: "Søndag",
      time: "09:30",
      frequency: "hver uke",
    },
  },
  {
    id: "group-kaffe",
    name: "Kirkekaffe & vertskap",
    category: "tjenestegruppe",
    memberIds: ["person-1", "person-2", "person-4"],
    leaderIds: ["person-1"], // Kari Nordmann is leader
    deputyLeaderIds: ["person-2"], // Ola Hansen is deputy leader
    meetingSchedule: {
      weekday: "Søndag",
      time: "10:30",
      frequency: "annenhver uke",
    },
  },
  {
    id: "group-barn",
    name: "Søndagsskole & barn",
    category: "tjenestegruppe",
    memberIds: ["person-3"],
    leaderIds: ["person-3"], // Ingrid Berg is leader
    deputyLeaderIds: [],
    meetingSchedule: {
      weekday: "Søndag",
      time: "11:15",
      frequency: "annenhver uke",
    },
  },
];

export const initialGatherings: Gathering[] = [
  {
    id: "gathering-1",
    groupId: "group-kaffe",
    title: "Gudstjeneste & dåp",
    startsAt: "2026-09-06T11:00:00.000Z",
    location: "Hovedsalen og kafeen",
    type: "arrangement",
  },
  {
    id: "gathering-2",
    groupId: "group-lyd",
    title: "Ungdomsmøte & lovsang",
    startsAt: "2026-09-11T19:00:00.000Z",
    location: "Ungdomssalen",
    type: "arrangement",
  },
  {
    id: "gathering-3",
    groupId: "group-kaffe",
    title: "Høstgudstjeneste & kirkelunsj",
    startsAt: "2026-09-13T11:00:00.000Z",
    location: "Hovedsalen og kafeen",
    type: "arrangement",
  },
  {
    id: "gathering-4",
    groupId: "group-kaffe",
    title: "Kaffeteam-samling & menyplanlegging",
    startsAt: "2026-09-16T18:30:00.000Z",
    location: "Kjøkkenet & peisestua",
    type: "gruppesamling",
  },
  {
    id: "gathering-5",
    groupId: "group-lyd",
    title: "Lydteknisk opplæring & rigging",
    startsAt: "2026-09-22T19:00:00.000Z",
    location: "Hovedsalen",
    type: "gruppesamling",
  },
  {
    id: "gathering-6",
    groupId: "group-lyd",
    title: "Familiegudstjeneste & barnekor",
    startsAt: "2026-09-27T11:00:00.000Z",
    location: "Hovedsalen",
    type: "arrangement",
  },
  {
    id: "gathering-7",
    groupId: "group-barn",
    title: "Søndagsskole semesteroppstart",
    startsAt: "2026-09-06T11:15:00.000Z",
    location: "Kjellersalen",
    type: "arrangement",
  },
];

export const initialGroupMessages: GroupMessage[] = [
  {
    id: "msg-1",
    groupId: "group-kaffe",
    senderPersonId: "person-1",
    senderName: "Kari Nordmann",
    content: "Velkommen til nytt semester i kaffegruppen! Husk å sjekke datoene dine for september.",
    createdAt: "2026-09-01T09:00:00.000Z",
  },
  {
    id: "msg-2",
    groupId: "group-lyd",
    senderPersonId: "person-2",
    senderName: "Ola Hansen",
    content: "Vi har en teknisk opplæringskveld tirsdag 22. september kl. 19:00.",
    createdAt: "2026-09-02T14:30:00.000Z",
  },
];

export const initialTasks: Task[] = [
  {
    id: "task-1",
    gatheringId: "gathering-1",
    groupId: "group-lyd",
    title: "Lydtekniker søndag",
    description: "Styre miksebordet, sjekke trådløse mikrofoner og lydprøve med lovsangsbandet fra kl. 09:30.",
    instruction: "Møt opp kl. 09:30 for rigging og lydsjekk med lovsangsteamet. Sjekk batterinivå på alle trådløse mygger og håndholdte mikrofoner. Juster volumnivå under tale og lovsang i henhold til menighetens lydretningslinjer. Slå av alt utstyr etter gudstjenesten.",
    status: "confirmed",
    neededCount: 1,
  },
  {
    id: "task-2",
    gatheringId: "gathering-1",
    groupId: "group-lyd",
    title: "Prosjektor & streaming",
    description: "Kjøre sangtekster og bibeltekster på storskjerm under gudstjenesten samt starte opptak.",
    instruction: "Møt opp kl. 10:15. Start opp styrings-PC, åpne presentasjonsprogrammet og importer dagens sanger og prekentekster. Test projektor og start direktesendingen 2 minutter før møtestart.",
    status: "confirmed",
    neededCount: 1,
  },
  {
    id: "task-8",
    gatheringId: "gathering-1",
    groupId: "group-lyd",
    title: "Kamerastyring",
    description: "Styre hovedkamera og nærbilder under talen og lovsangen.",
    instruction: "Oppmøte kl. 10:20. Klargjør kamerastativ og sjekk at bildeoverføring til bildemikser fungerer. Følg møteleder, lovsangsleder og taler med jevne kamerapanoreringer.",
    status: "confirmed",
    neededCount: 1,
  },
  {
    id: "task-9",
    gatheringId: "gathering-1",
    groupId: "group-lyd",
    title: "Lydopptak & podcast",
    description: "Ta opp talen digitalt og klargjøre fil for menighetens podcast. Forrige person meldte forfall.",
    instruction: "Trykk 'Record' på masteropptakeren når talen starter. Etter møtet eksporteres lydfilen til mp3 og lastes opp i mappen for ukens preken.",
    status: "vacant",
    neededCount: 1,
  },
  {
    id: "task-3",
    gatheringId: "gathering-1",
    groupId: "group-kaffe",
    title: "Kirkekaffe-ansvarlig",
    description: "Trakte kaffe og te før møtet, sette frem kopper og rydde av etterpå.",
    instruction: "Møt opp kl. 10:00. Sett på 4 kanner kaffe og 2 kanner tevann. Finn frem kopper, servietter, melk og sukker på serveringsbordet. Etter møteslutt: fyll oppvaskmaskinen, tørk av bordene og kast søppel.",
    status: "confirmed",
    neededCount: 2,
  },
  {
    id: "task-4",
    gatheringId: "gathering-1",
    groupId: "group-kaffe",
    title: "Vertskap i døren",
    description: "Ønske velkommen med et smil, dele ut program og hjelpe barnefamilier til rette. Forrige person meldte forfall.",
    instruction: "Stå ved hovedinngangen fra kl. 10:35. Hils på alle som kommer, del ut gudstjenesteprogram og vis nye familier veien til søndagsskolens rom.",
    status: "vacant",
    neededCount: 2,
  },
  {
    id: "task-5",
    gatheringId: "gathering-1",
    groupId: "group-kaffe",
    title: "Bake kake / fruktfat",
    description: "Ta med en langpannekake, boller eller et friskt fruktfat til kirkekaffen etter gudstjenesten.",
    instruction: "Lever ferdig oppskåret kake eller fruktfat på kjøkkenet før kl. 10:45. Husk å merke fat med navn om du ønsker det tilbake.",
    status: "open",
  },
  {
    id: "task-6",
    gatheringId: "gathering-2",
    groupId: "group-lyd",
    title: "Lydtekniker ungdomsmøte",
    description: "Lyd for ungdomsbandet fredag kveld. Oppmøte kl. 18:00 for soundcheck.",
    instruction: "Rigging og lydprøver med ungdomsbandet kl. 18:00–18:45. Hold kontroll på scenemonitorer og masterlyd under lovsangen.",
    status: "confirmed",
    neededCount: 1,
  },
  {
    id: "task-7",
    gatheringId: "gathering-3",
    groupId: "group-kaffe",
    title: "Kjøkkenansvarlig høstlunsj",
    description: "Lede anretning av felles lunsj, organisere servering og sette i gang oppvask.",
    instruction: "Koordiner kjøkkenteamet fra kl. 10:30. Sett opp lunsjbuffet, hold oversikt over påfyll under serveringen og fordel oppgaver for opprydding og oppvask.",
    status: "open",
    neededCount: 2,
  },
];

export const initialAssignments: Assignment[] = [
  {
    id: "assign-1",
    taskId: "task-1",
    personId: "person-2", // Ola Hansen has Lydtekniker søndag
    response: "confirmed",
  },
  {
    id: "assign-2",
    taskId: "task-2",
    personId: "person-1", // Kari Nordmann has Prosjektor
    response: "confirmed",
  },
  {
    id: "assign-8",
    taskId: "task-8",
    personId: "person-1", // Kari Nordmann has Kamera
    response: "confirmed",
  },
  {
    id: "assign-9",
    taskId: "task-9",
    personId: "person-2", // Previous person withdrew -> vacant
    response: "withdrawn",
  },
  {
    id: "assign-3-ola",
    taskId: "task-3",
    personId: "person-2", // Ola Hansen - Akseptert
    response: "confirmed",
  },
  {
    id: "assign-3-kari",
    taskId: "task-3",
    personId: "person-1", // Kari Nordmann - Forfall
    response: "withdrawn",
  },
  {
    id: "assign-3-ingrid",
    taskId: "task-3",
    personId: "person-3", // Ingrid Berg - Avslått
    response: "declined",
  },
  {
    id: "assign-3-jonas",
    taskId: "task-3",
    personId: "person-4", // Jonas Lie - Forespurt
    response: "pending",
  },
  {
    id: "assign-4",
    taskId: "task-4",
    personId: "person-2", // Previous person withdrew -> vacant
    response: "withdrawn",
  },
  {
    id: "assign-6",
    taskId: "task-6",
    personId: "person-1", // Kari Nordmann has Lydtekniker ungdomsmøte
    response: "confirmed",
  },
];
