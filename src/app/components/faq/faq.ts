import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatCardModule, MatIconModule],
  templateUrl: './faq.html',
  styleUrls: ['./faq.scss'],
})
export class FAQComponent {
  faqs = [
    {
      question: 'What is a Squares game?',
      answer:
        "Squares is a classic game of chance played on a 10x10 grid. Participants purchase individual squares within the grid before the game begins. Once every square is sold, numbers from 0 to 9 are randomly assigned to each row and column. Winners are determined at the end of each quarter by matching the last digit of each team's score to the corresponding coordinates on the grid.",
    },
    {
      question: 'How do I win?',
      answer:
        'Look at the last digit of each team’s score at the end of a quarter. Find the corresponding numbers on the grid’s axes. The person whose square is at the intersection of those two numbers wins the prize for that quarter!',
    },
    {
      question: 'How are scores updated?',
      answer: 'Scores are updated automatically by the system.',
    },
    {
      question: 'What happens if a square is not claimed?',
      answer:
        'It depends on the game rules set by the Game Host. Usually, the prize either rolls over to the next quarter or stays with the "house".',
    },
    {
      question: 'How do I pay for my squares?',
      answer:
        'No payments are facilitated in this app. However, Game Hosts can provide a Venmo link on the game page.',
    },
    {
      question: 'Do I need to save my choices when picking boxes?',
      answer:
        'No. When you click a square to claim it (or click your own unpaid square to release it), the change is saved automatically to the database. You will see a small loading indicator in the corner of the grid while the save is in progress.',
    },
    {
      question: 'Why haven’t the grid numbers been drawn yet?',
      answer:
        'Numbers for the rows and columns are assigned randomly only when the game is officially started by the Game Host. This ensures total fairness so that no one knows which numbers they have until the grid is locked.',
    },
    {
      question: 'Is this legal?',
      answer:
        'This platform is designed and strictly intended for entertainment and social purposes only. Squares does not function as a gambling operator, sportsbook, or casino. We do not accept, hold, or payout wagers, nor do we determine the legality of your participation in any pool.\n\n' +
        'It is the sole responsibility of the organizer and the participants to ensure that their specific pool complies with all applicable local, state/provincial, and federal laws regarding sports pools and gambling. Squres assumes no liability for the unauthorized or illegal use of this service. If you are unsure about the legality of a paid pool in your jurisdiction, please consult a legal professional or restrict your game to "for fun" (non-monetary) use only.',
    },
  ];
}
