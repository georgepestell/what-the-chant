import type { Chant } from '../types'

export const CATEGORIES = ['All', 'Palestine', 'SUTR', 'Stop The War', 'Workers Rights', 'Fascism', 'Tories']

export const MOCK_CHANTS: Chant[] = [
    { id: 1, title: 'Free Free - Palestine', categories: ['Palestine'] },
    { id: 2, title: 'From the River to the Sea\nPalestine Will Be Free', categories: ['Palestine'] },
    { id: 3, title: 'Say It Loud, Say It Clear, Refugees Are Welcome Here', categories: ['SUTR'] },
    { id: 4, title: 'No War But Class War', categories: ['Stop The War'] },
    {
        id: 5,
        title: 'The People United Will Never Be Divided - A chant for solidarity and unity in the workplace struggle',
        categories: ['Workers Rights', 'Fascism'],
    },
    {
        id: 6,
        title: 'Siamo tutti antifascisti',
        categories: ['Fascism'],
    },
    {
        id: 7,
        title: "Build a bonfire, build a bonfire, put the [tories/tommy] at the top. Put the racists in the middle, and we'll burn the fucking lot!",
        categories: ['Tories'],
    },
    { id: 8, title: 'The People, United. Will Never Be Defeated', categories: ['Workers Rights', 'SUTR'] },
    { id: 9, title: 'Stop the War, Stop the Killing', categories: ['Stop The War', 'Palestine'] },
    { id: 10, title: 'No Justice, No Peace\nNo Racist Police', categories: ['Palestine', 'Workers Rights'] },
]
