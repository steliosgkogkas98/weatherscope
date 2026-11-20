import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { IconName, iconSvg } from './weather-icons';

/**
 * `<app-icon name="rain" [size]="32" />`
 * Renders an icon from our own SVG set. The markup is a constant from our code
 * (never user input), so it is safe to mark it as trusted HTML.
 */
@Component({
  selector: 'app-icon',
  template: '<span class="icon" [innerHTML]="svg()"></span>',
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      vertical-align: middle;
    }
    .icon {
      display: contents;
    }
  `,
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>();
  readonly size = input(24);

  protected readonly svg = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(iconSvg(this.name(), this.size())),
  );
}
