/*! UIkit 3.5.9 | https://www.getuikit.com | (c) 2014 - 2020 YOOtheme | MIT License */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('uikit-util')) :
    typeof define === 'function' && define.amd ? define('uikittooltip', ['uikit-util'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.UIkitTooltip = factory(global.UIkit.util));
}(this, (function (uikitUtil) { 'use strict';

    var Container = {

        props: {
            container: Boolean
        },

        data: {
            container: true
        },

        computed: {

            container: function(ref) {
                var container = ref.container;

                return container === true && this.$container || container && uikitUtil.$(container);
            }

        }

    };

    var Togglable = {

        props: {
            cls: Boolean,
            animation: 'list',
            duration: Number,
            origin: String,
            transition: String
        },

        data: {
            cls: false,
            animation: [false],
            duration: 200,
            origin: false,
            transition: 'linear',

            initProps: {
                overflow: '',
                height: '',
                paddingTop: '',
                paddingBottom: '',
                marginTop: '',
                marginBottom: ''
            },

            hideProps: {
                overflow: 'hidden',
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: 0
            }

        },

        computed: {

            hasAnimation: function(ref) {
                var animation = ref.animation;

                return !!animation[0];
            },

            hasTransition: function(ref) {
                var animation = ref.animation;

                return this.hasAnimation && animation[0] === true;
            }

        },

        methods: {

            toggleElement: function(targets, show, animate) {
                var this$1 = this;

                return uikitUtil.Promise.all(uikitUtil.toNodes(targets).map(function (el) { return new uikitUtil.Promise(function (resolve) { return this$1._toggleElement(el, show, animate).then(resolve, uikitUtil.noop); }
                    ); }
                ));
            },

            isToggled: function(el) {
                var nodes = uikitUtil.toNodes(el || this.$el);
                return this.cls
                    ? uikitUtil.hasClass(nodes, this.cls.split(' ')[0])
                    : !uikitUtil.hasAttr(nodes, 'hidden');
            },

            updateAria: function(el) {
                if (this.cls === false) {
                    uikitUtil.attr(el, 'aria-hidden', !this.isToggled(el));
                }
            },

            _toggleElement: function(el, show, animate) {
                var this$1 = this;


                show = uikitUtil.isBoolean(show)
                    ? show
                    : uikitUtil.Animation.inProgress(el)
                        ? uikitUtil.hasClass(el, 'uk-animation-leave')
                        : uikitUtil.Transition.inProgress(el)
                            ? el.style.height === '0px'
                            : !this.isToggled(el);

                if (!uikitUtil.trigger(el, ("before" + (show ? 'show' : 'hide')), [this])) {
                    return uikitUtil.Promise.reject();
                }

                var promise = (
                    uikitUtil.isFunction(animate)
                        ? animate
                        : animate === false || !this.hasAnimation
                            ? this._toggle
                            : this.hasTransition
                                ? toggleHeight(this)
                                : toggleAnimation(this)
                )(el, show);

                uikitUtil.trigger(el, show ? 'show' : 'hide', [this]);

                var final = function () {
                    uikitUtil.trigger(el, show ? 'shown' : 'hidden', [this$1]);
                    this$1.$update(el);
                };

                return (promise || uikitUtil.Promise.resolve()).then(final);
            },

            _toggle: function(el, toggled) {

                if (!el) {
                    return;
                }

                toggled = Boolean(toggled);

                var changed;
                if (this.cls) {
                    changed = uikitUtil.includes(this.cls, ' ') || toggled !== uikitUtil.hasClass(el, this.cls);
                    changed && uikitUtil.toggleClass(el, this.cls, uikitUtil.includes(this.cls, ' ') ? undefined : toggled);
                } else {
                    changed = toggled === el.hidden;
                    changed && (el.hidden = !toggled);
                }

                uikitUtil.$$('[autofocus]', el).some(function (el) { return uikitUtil.isVisible(el) ? el.focus() || true : el.blur(); });

                this.updateAria(el);

                if (changed) {
                    uikitUtil.trigger(el, 'toggled', [this]);
                    this.$update(el);
                }
            }

        }

    };

    function toggleHeight(ref) {
        var isToggled = ref.isToggled;
        var duration = ref.duration;
        var initProps = ref.initProps;
        var hideProps = ref.hideProps;
        var transition = ref.transition;
        var _toggle = ref._toggle;

        return function (el, show) {

            var inProgress = uikitUtil.Transition.inProgress(el);
            var inner = el.hasChildNodes ? uikitUtil.toFloat(uikitUtil.css(el.firstElementChild, 'marginTop')) + uikitUtil.toFloat(uikitUtil.css(el.lastElementChild, 'marginBottom')) : 0;
            var currentHeight = uikitUtil.isVisible(el) ? uikitUtil.height(el) + (inProgress ? 0 : inner) : 0;

            uikitUtil.Transition.cancel(el);

            if (!isToggled(el)) {
                _toggle(el, true);
            }

            uikitUtil.height(el, '');

            // Update child components first
            uikitUtil.fastdom.flush();

            var endHeight = uikitUtil.height(el) + (inProgress ? 0 : inner);
            uikitUtil.height(el, currentHeight);

            return (show
                ? uikitUtil.Transition.start(el, uikitUtil.assign({}, initProps, {overflow: 'hidden', height: endHeight}), Math.round(duration * (1 - currentHeight / endHeight)), transition)
                : uikitUtil.Transition.start(el, hideProps, Math.round(duration * (currentHeight / endHeight)), transition).then(function () { return _toggle(el, false); })
            ).then(function () { return uikitUtil.css(el, initProps); });

        };
    }

    function toggleAnimation(cmp) {
        return function (el, show) {

            uikitUtil.Animation.cancel(el);

            var animation = cmp.animation;
            var duration = cmp.duration;
            var _toggle = cmp._toggle;

            if (show) {
                _toggle(el, true);
                return uikitUtil.Animation.in(el, animation[0], duration, cmp.origin);
            }

            return uikitUtil.Animation.out(el, animation[1] || animation[0], duration, cmp.origin).then(function () { return _toggle(el, false); });
        };
    }

    var Position = {

        props: {
            pos: String,
            offset: null,
            flip: Boolean,
            clsPos: String
        },

        data: {
            pos: ("bottom-" + (!uikitUtil.isRtl ? 'left' : 'right')),
            flip: true,
            offset: false,
            clsPos: ''
        },

        computed: {

            pos: function(ref) {
                var pos = ref.pos;

                return (pos + (!uikitUtil.includes(pos, '-') ? '-center' : '')).split('-');
            },

            dir: function() {
                return this.pos[0];
            },

            align: function() {
                return this.pos[1];
            }

        },

        methods: {

            positionAt: function(element, target, boundary) {

                uikitUtil.removeClasses(element, ((this.clsPos) + "-(top|bottom|left|right)(-[a-z]+)?"));

                var node;
                var ref = this;
                var offset = ref.offset;
                var axis = this.getAxis();

                if (!uikitUtil.isNumeric(offset)) {
                    node = uikitUtil.$(offset);
                    offset = node
                        ? uikitUtil.offset(node)[axis === 'x' ? 'left' : 'top'] - uikitUtil.offset(target)[axis === 'x' ? 'right' : 'bottom']
                        : 0;
                }

                var ref$1 = uikitUtil.positionAt(
                    element,
                    target,
                    axis === 'x' ? ((uikitUtil.flipPosition(this.dir)) + " " + (this.align)) : ((this.align) + " " + (uikitUtil.flipPosition(this.dir))),
                    axis === 'x' ? ((this.dir) + " " + (this.align)) : ((this.align) + " " + (this.dir)),
                    axis === 'x' ? ("" + (this.dir === 'left' ? -offset : offset)) : (" " + (this.dir === 'top' ? -offset : offset)),
                    null,
                    this.flip,
                    boundary
                ).target;
                var x = ref$1.x;
                var y = ref$1.y;

                this.dir = axis === 'x' ? x : y;
                this.align = axis === 'x' ? y : x;

                uikitUtil.toggleClass(element, ((this.clsPos) + "-" + (this.dir) + "-" + (this.align)), this.offset === false);

            },

            getAxis: function() {
                return this.dir === 'top' || this.dir === 'bottom' ? 'y' : 'x';
            }

        }

    };

    var obj;

    var actives = [];

    var Component = {

        mixins: [Container, Togglable, Position],

        args: 'title',

        props: {
            delay: Number,
            title: String
        },

        data: {
            pos: 'top',
            title: '',
            delay: 0,
            animation: ['uk-animation-scale-up'],
            duration: 100,
            cls: 'uk-active',
            clsPos: 'uk-tooltip'
        },

        beforeConnect: function() {
            this._hasTitle = uikitUtil.hasAttr(this.$el, 'title');
            uikitUtil.attr(this.$el, {title: '', 'aria-expanded': false});
        },

        disconnected: function() {
            this.hide();
            uikitUtil.attr(this.$el, {title: this._hasTitle ? this.title : null, 'aria-expanded': null});
        },

        methods: {

            show: function() {
                var this$1 = this;


                if (this.isActive() || !this.title) {
                    return;
                }

                actives.forEach(function (active) { return active.hide(); });
                actives.push(this);

                this._unbind = uikitUtil.on(document, uikitUtil.pointerUp, function (e) { return !uikitUtil.within(e.target, this$1.$el) && this$1.hide(); });

                clearTimeout(this.showTimer);
                this.showTimer = setTimeout(this._show, this.delay);
            },

            hide: function() {
                var this$1 = this;


                if (!this.isActive() || uikitUtil.matches(this.$el, 'input:focus')) {
                    return;
                }

                this.toggleElement(this.tooltip, false, false).then(function () {

                    actives.splice(actives.indexOf(this$1), 1);

                    clearTimeout(this$1.showTimer);

                    this$1.tooltip = uikitUtil.remove(this$1.tooltip);
                    this$1._unbind();
                });
            },

            _show: function() {
                var this$1 = this;


                this.tooltip = uikitUtil.append(this.container,
                    ("<div class=\"" + (this.clsPos) + "\"> <div class=\"" + (this.clsPos) + "-inner\">" + (this.title) + "</div> </div>")
                );

                uikitUtil.on(this.tooltip, 'toggled', function () {

                    var toggled = this$1.isToggled(this$1.tooltip);

                    uikitUtil.attr(this$1.$el, 'aria-expanded', toggled);

                    if (!toggled) {
                        return;
                    }

                    this$1.positionAt(this$1.tooltip, this$1.$el);

                    this$1.origin = this$1.getAxis() === 'y'
                        ? ((uikitUtil.flipPosition(this$1.dir)) + "-" + (this$1.align))
                        : ((this$1.align) + "-" + (uikitUtil.flipPosition(this$1.dir)));
                });

                this.toggleElement(this.tooltip, true);

            },

            isActive: function() {
                return uikitUtil.includes(actives, this);
            }

        },

        events: ( obj = {

            focus: 'show',
            blur: 'hide'

        }, obj[(uikitUtil.pointerEnter + " " + uikitUtil.pointerLeave)] = function (e) {
                if (uikitUtil.isTouch(e)) {
                    return;
                }
                e.type === uikitUtil.pointerEnter
                    ? this.show()
                    : this.hide();
            }, obj[uikitUtil.pointerDown] = function (e) {
                if (!uikitUtil.isTouch(e)) {
                    return;
                }
                this.isActive()
                    ? this.hide()
                    : this.show();
            }, obj )

    };

    if (typeof window !== 'undefined' && window.UIkit) {
        window.UIkit.component('tooltip', Component);
    }

    return Component;

})));
