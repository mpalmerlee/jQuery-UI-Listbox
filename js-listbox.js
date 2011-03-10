/*
 * JSListBox uses jQuery UI menu to style items
 */
// configObject is an object as such: {'containerSelector':'id', 'stylemap':{'border':'none','background':'none'}}
JSListBox = function(configObject) {
	this.items = [];
	this.containerSelector = '#' + configObject.containerSelector;
	$(this.containerSelector).css("position", "relative");
	var tmpContainer = $('<div class="menuContainerJSListBox" style="position:absolute;top:0;bottom:0;left:0;right:0;"></div>');
	if(configObject.stylemap)
		tmpContainer.css(configObject.stylemap);

	this.menuContainerHTML = tmpContainer.clone().wrap('<div></div>').parent().html();//need to get tmpContainer's html itself
	
	this.SelectedItem = null;
	this.SelectedIndex = null;
	
};

JSListBox.prototype.clear = function() {
	this.items = [];
	this.refresh();
};

JSListBox.prototype.addItem = function(item) {
	this.items.push(item);
	this.refresh();
};

JSListBox.prototype.addItems = function(newItems) {
	for(var i in newItems)
	{
		this.items.push(newItems[i]);
	}
	this.refresh();
};

JSListBox.prototype.removeAt = function(index) {
	this.items.splice(index, 1);
	this.refresh();
};

JSListBox.prototype.refresh = function() {
	
	if(this.menuContainer)//is this right? or should it be $(this.menuContainer)?
		this.menuContainer.unbind();

	$(this.containerSelector).html(this.menuContainerHTML);
	this.menuContainer = $(this.containerSelector + ' .menuContainerJSListBox');
	
	for(var i in this.items)
	{
		var item = this.items[i];
		var renderedItemHTML = item.render();
		var itemActivated = false;
		if(this.SelectedItem == item)
			itemActivated = true;

		$( "<li></li>" ).data("jslistbox.item", item).attr("enabled", item.enabled).attr("activated", itemActivated).append($(renderedItemHTML)).appendTo(this.menuContainer);
	}
	var self = this;
	$(this.menuContainer).list( 
		{ 	
			selected: 
			function( event, ui ) {
				var item = ui.item.data( "jslistbox.item" );
				
				self.setSelectedItem(item);
				
				item.onClick();//TODO: should we pass event data?
				return true;
			},
			dblselected: 
			function( event, ui ) {
				var item = ui.item.data( "jslistbox.item" );
				item.onDblClick();//TODO: should we pass event data?
				return true;
			}
		}
	);
	
	//$(this.menuContainer).disableSelection();
};

JSListBox.prototype.setSelectedItem = function(item) {
	this.SelectedItem = item;
	this.SelectedIndex = this.getItemIndex(item);
};

JSListBox.prototype.setSelectedIndex = function(index) {
	this.SelectedItem = this.items[index];
	this.SelectedIndex = index;
};

JSListBox.prototype.getItemIndex = function(item) {
	for(var i in this.items)
	{
		if(this.items[i] == item)
			return i;
	}
	return null;
};

JSListBox.Item = Class.extend({

	value: "",//what is shown in the item
	enabled: true,

	init: function() {

	},
	
	render: function() {
		return '<a href="#">' + this.value + '</a>'; //this allows painting to be overridden in classes which extend JSListBox.Item
	},
	
	onClick: function() {
		//console.log('JSListBox.Item Click');
	},
	onDblClick: function() {
		//console.log('JSListBox.Item DblClick');
	}
});

/*
 * jQuery UI Menu (not officially released)
 * 
 * This widget isn't yet finished and the API is subject to change. We plan to finish
 * it for the next release. You're welcome to give it a try anyway and give us feedback,
 * as long as you're okay with migrating your code later on. We can help with that, too.
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Menu
 *
 * Depends:
 *	jquery.ui.core.js
 *  jquery.ui.widget.js
 */
(function($) {

$.widget("ui.list", {
	_create: function() {
		var self = this;
		this.element
			.addClass("ui-menu ui-widget ui-widget-content ui-corner-all")
			.attr({
				role: "listbox",
				"aria-activedescendant": "ui-active-menuitem"
			})
			.click(function( event ) {
				if ( !$( event.target ).closest( ".ui-menu-item a" ).length ) {
					return;
				}
				if(self.highlighted)
				{
					self.activate( event, self.highlighted );
					// temporary
					event.preventDefault();
					self.select( event );
				}
			})
			.dblclick(function( event ) {
				if ( !$( event.target ).closest( ".ui-menu-item a" ).length ) {
					return;
				}
				// temporary
				if(self.highlighted)
				{
					event.preventDefault();
					self.dblselect( event );
				}
			});
		this.refresh();
	},
	
	refresh: function() {
		var self = this;

		// don't refresh list items that are already adapted
		var items = this.element.children("li:not(.ui-menu-item):has(a)")
			.addClass("ui-menu-item")
			.attr("role", "menuitem");
		
		items.children("a")
			.addClass("ui-corner-all")
			.attr("tabindex", -1)
			// mouseenter doesn't work with event delegation
			.mouseenter(function( event ) {
				//self.activate( event, $(this).parent() );
				self.highlight( event, $(this).parent() );
			})
			.mouseleave(function() {
				//self.deactivate();
				self.lowlight();
			});
		
		//check for activated to select
		for( var i = 0; i < items.length; i++)
		{
			var item = $(items[i]);
			if(item.attr("activated") == "true")
				self.activate(null, item);
		}
	},
	
	highlight: function( event, item) {
		this.lowlight();
		//only allow highlight if item attr enabled = true
		if(item.attr("enabled") == "true")
		{
			this.highlighted = item.eq(0)
				.children("a")
					.addClass("ui-listbox-state-highlight")
					//.attr("id", "ui-active-menuitem")
				.end();
		}
	},
	
	lowlight: function() {
		if (!this.highlighted) { return; }

		this.highlighted.children("a")
			.removeClass("ui-listbox-state-highlight");
			//.removeAttr("id");
		//this._trigger("blur");
		this.highlighted = null;
	},

	activate: function( event, item ) {
		this.deactivate();
		if (this.hasScroll()) {
			var offset = item.offset().top - this.element.offset().top,
				scroll = this.element.attr("scrollTop"),
				elementHeight = this.element.height();
			if (offset < 0) {
				this.element.attr("scrollTop", scroll + offset);
			} else if (offset >= elementHeight) {
				this.element.attr("scrollTop", scroll + offset - elementHeight + item.height());
			}
		}
		this.active = item.eq(0)
			.children("a")
				.addClass("ui-state-hover")
				.attr("id", "ui-active-menuitem")
			.end();
		this._trigger("focus", event, { item: item });
	},

	deactivate: function() {
		if (!this.active) { return; }

		this.active.children("a")
			.removeClass("ui-state-hover")
			.removeAttr("id");
		this._trigger("blur");
		this.active = null;
	},

	next: function(event) {
		this.move("next", ".ui-menu-item:first", event);
	},

	previous: function(event) {
		this.move("prev", ".ui-menu-item:last", event);
	},

	first: function() {
		return this.active && !this.active.prevAll(".ui-menu-item").length;
	},

	last: function() {
		return this.active && !this.active.nextAll(".ui-menu-item").length;
	},

	move: function(direction, edge, event) {
		if (!this.active) {
			this.activate(event, this.element.children(edge));
			return;
		}
		var next = this.active[direction + "All"](".ui-menu-item").eq(0);
		if (next.length) {
			this.activate(event, next);
		} else {
			this.activate(event, this.element.children(edge));
		}
	},

	// TODO merge with previousPage
	nextPage: function(event) {
		if (this.hasScroll()) {
			// TODO merge with no-scroll-else
			if (!this.active || this.last()) {
				this.activate(event, this.element.children(".ui-menu-item:first"));
				return;
			}
			var base = this.active.offset().top,
				height = this.element.height(),
				result = this.element.children(".ui-menu-item").filter(function() {
					var close = $(this).offset().top - base - height + $(this).height();
					// TODO improve approximation
					return close < 10 && close > -10;
				});

			// TODO try to catch this earlier when scrollTop indicates the last page anyway
			if (!result.length) {
				result = this.element.children(".ui-menu-item:last");
			}
			this.activate(event, result);
		} else {
			this.activate(event, this.element.children(".ui-menu-item")
				.filter(!this.active || this.last() ? ":first" : ":last"));
		}
	},

	// TODO merge with nextPage
	previousPage: function(event) {
		if (this.hasScroll()) {
			// TODO merge with no-scroll-else
			if (!this.active || this.first()) {
				this.activate(event, this.element.children(".ui-menu-item:last"));
				return;
			}

			var base = this.active.offset().top,
				height = this.element.height();
				result = this.element.children(".ui-menu-item").filter(function() {
					var close = $(this).offset().top - base + height - $(this).height();
					// TODO improve approximation
					return close < 10 && close > -10;
				});

			// TODO try to catch this earlier when scrollTop indicates the last page anyway
			if (!result.length) {
				result = this.element.children(".ui-menu-item:first");
			}
			this.activate(event, result);
		} else {
			this.activate(event, this.element.children(".ui-menu-item")
				.filter(!this.active || this.first() ? ":last" : ":first"));
		}
	},

	hasScroll: function() {
		return this.element.height() < this.element.attr("scrollHeight");
	},

	select: function( event ) {
		this._trigger("selected", event, { item: this.active });
	},
	dblselect: function( event ) {
		this._trigger("dblselected", event, { item: this.active });
	}
});

}(jQuery));