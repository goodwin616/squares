import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gridName',
  standalone: true,
})
export class GridNamePipe implements PipeTransform {
  transform(name: string | null | undefined, allNames: string[]): string {
    if (!name) return '';

    const trimmedName = name.trim();
    const firstName = trimmedName.split(' ')[0] ?? '';

    // Find unique full names from the context
    const uniqueFullNames = [...new Set(allNames.filter((n) => !!n).map((n) => n.trim()))];

    // Check if other unique full names share the same first name
    const collisions = uniqueFullNames.filter((n) => n.split(' ')[0] === firstName);

    // If more than one unique person shares this first name, show full name
    if (collisions.length > 1) {
      return trimmedName;
    }

    return firstName;
  }
}
