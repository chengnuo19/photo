// @ts-nocheck — vendored from page-flip@2.0.7 (MIT), see LICENSE. Local changes marked "MB:".
import { PageCollection } from './Collection/PageCollection';
import { HTMLPageCollection } from './Collection/HTMLPageCollection';
import { PageRect, Point } from './BasicTypes';
import { Flip, FlipCorner, FlipDirection, FlippingState } from './Flip/Flip';
import { Orientation, Render } from './Render/Render';
import { HTMLUI } from './UI/HTMLUI';
import { Page } from './Page/Page';
import { EventObject } from './Event/EventObject';
import { HTMLRender } from './Render/HTMLRender';
import { FlipSetting, Settings } from './Settings';
import { UI } from './UI/UI';
import { Helper } from './Helper';

import './Style/stPageFlip.css';

/**
 * Class representing a main PageFlip object (HTML mode only).
 *
 * MB: canvas/image mode removed; added setPageSize(), a stoppable render loop,
 * full listener cleanup on destroy() and a `flipProgress` event.
 */
export class PageFlip extends EventObject {
    private mousePosition: Point;
    private isUserTouch = false;
    private isUserMove = false;

    private readonly setting: FlipSetting = null;
    private readonly block: HTMLElement; // Root HTML Element

    private pages: PageCollection = null;
    private flipController: Flip;
    private render: Render;

    private ui: UI;

    constructor(inBlock: HTMLElement, setting: Partial<FlipSetting>) {
        super();

        this.setting = new Settings().getSettings(setting);
        this.block = inBlock;
    }

    /** MB: stop the render loop and remove every listener, then remove the root element */
    public destroy(): void {
        this.render.stop();
        this.ui.destroy();
        this.block.remove();
    }

    public update(): void {
        this.render.update();
        this.pages.show();
    }

    /**
     * MB: change page size in place (FIXED mode) without rebuilding the book.
     * A running flip animation is completed first so geometry never jumps mid-flip.
     */
    public setPageSize(width: number, height: number): void {
        this.render.finishAnimation();
        this.setting.width = width;
        this.setting.height = height;
        this.setting.minWidth = this.setting.maxWidth = width;
        this.setting.minHeight = this.setting.maxHeight = height;
        this.update();
    }

    public loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
        this.ui = new HTMLUI(this.block, this, this.setting, items);

        this.render = new HTMLRender(this, this.setting, this.ui.getDistElement());

        this.flipController = new Flip(this.render, this);

        this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
        this.pages.load();

        this.render.start();

        this.pages.show(this.setting.startPage);

        // safari fix
        setTimeout(() => {
            if (this.render.isStopped()) return;
            this.ui.update();
            this.trigger('init', this, {
                page: this.setting.startPage,
                mode: this.render.getOrientation(),
            });
        }, 1);
    }

    public updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
        const current = this.pages.getCurrentPageIndex();

        this.pages.destroy();
        this.pages = new HTMLPageCollection(this, this.render, this.ui.getDistElement(), items);
        this.pages.load();
        (this.ui as HTMLUI).updateItems(items);
        this.render.reload();

        this.pages.show(current);

        this.trigger('update', this, {
            page: current,
            mode: this.render.getOrientation(),
        });
    }

    public clear(): void {
        this.pages.destroy();
        (this.ui as HTMLUI).clear();
    }

    public turnToPrevPage(): void {
        this.pages.showPrev();
    }

    public turnToNextPage(): void {
        this.pages.showNext();
    }

    public turnToPage(page: number): void {
        this.pages.show(page);
    }

    public flipNext(corner: FlipCorner = FlipCorner.TOP): void {
        this.flipController.flipNext(corner);
    }

    public flipPrev(corner: FlipCorner = FlipCorner.TOP): void {
        this.flipController.flipPrev(corner);
    }

    public flip(page: number, corner: FlipCorner = FlipCorner.TOP): void {
        this.flipController.flipToPage(page, corner);
    }

    public updateState(newState: FlippingState): void {
        this.trigger('changeState', this, newState);
    }

    public updatePageIndex(newPage: number): void {
        this.trigger('flip', this, newPage);
    }

    /** MB: emitted on every animation frame while a page is folded or flipping */
    public updateFlipProgress(progress: number, direction: number): void {
        this.trigger('flipProgress', this, { progress, direction });
    }

    public updateOrientation(newOrientation: Orientation): void {
        this.ui.setOrientationStyle(newOrientation);
        this.update();
        this.trigger('changeOrientation', this, newOrientation);
    }

    public getPageCount(): number {
        return this.pages.getPageCount();
    }

    public getCurrentPageIndex(): number {
        return this.pages.getCurrentPageIndex();
    }

    public getPage(pageIndex: number): Page {
        return this.pages.getPage(pageIndex);
    }

    public getRender(): Render {
        return this.render;
    }

    public getFlipController(): Flip {
        return this.flipController;
    }

    public getOrientation(): Orientation {
        return this.render.getOrientation();
    }

    public getBoundsRect(): PageRect {
        return this.render.getRect();
    }

    public getSettings(): FlipSetting {
        return this.setting;
    }

    public getUI(): UI {
        return this.ui;
    }

    public getState(): FlippingState {
        return this.flipController.getState();
    }

    public getPageCollection(): PageCollection {
        return this.pages;
    }

    public startUserTouch(pos: Point): void {
        this.mousePosition = pos; // Save touch position
        this.isUserTouch = true;
        this.isUserMove = false;
    }

    public userMove(pos: Point, isTouch: boolean): void {
        if (!this.isUserTouch && !isTouch && this.setting.showPageCorners) {
            this.flipController.showCorner(pos); // fold Page Corner
        } else if (this.isUserTouch) {
            if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
                this.isUserMove = true;
                // MB: in portrait the direction follows the drag (right = back, left = forward);
                // in landscape it follows the side where the drag started.
                const dir =
                    this.getOrientation() === Orientation.PORTRAIT
                        ? pos.x > this.mousePosition.x
                            ? FlipDirection.BACK
                            : FlipDirection.FORWARD
                        : undefined;
                this.flipController.fold(pos, this.mousePosition, dir);
            }
        }
    }

    public userStop(pos: Point, isSwipe = false): void {
        if (this.isUserTouch) {
            this.isUserTouch = false;

            if (!isSwipe) {
                if (!this.isUserMove) this.flipController.flip(pos);
                else this.flipController.stopMove();
            }
        }
    }
}

