/*
 jQuery Highlight plugin (jQuery 1.4 or later)
 
 Copyright (c) 2015 furyu <furyutei@gmail.com>
 http://furyu.hatenablog.com/
 
 MIT license
 
 References
 - highlight v5 by Johann Burkard
   http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html
 
 - jQuery Highlight plugin by Bartek Szopka
   http://bartaz.github.io/sandbox.js/jquery.highlight.html
*/

(function() {
'use strict';

var DEFAULT_OPTIONS = {
        element : 'span',
        className : 'highlight',
        caseSensitive : false,
        wordsOnly : false,
        excludeNodes : ['style', 'script', 'textarea', 'iframe', 'frame'],
        color : '#ffcc33',
        styleId : 'highlight_style',
        documentHead : 'head',
        baseNode : 'body'
    },
    $ = jQuery,
    DEBUG = false,
    current_color = {};

function debug_log(string) {
    if ( ! DEBUG ) {
        return;
    }
    console.log(string);
} // end of debug_log()

$.extend({
    setHighlightColor : function(color, options) {
        options = $.extend({}, DEFAULT_OPTIONS, options);
        if ( color ) {
            options.color = color;
        }
        var color = options.color,
            element = options.element.toLowerCase(),
            className = options.className,
            styleId = options.styleId,
            css_selector = element + '.' + className,
            documentHead = options.documentHead;
        
        $('style#' + styleId).remove();
        $('<style type="text/css" />').attr('id', styleId).text(css_selector +  '{background-color:' + color + ';}').appendTo($(documentHead));
        current_color[css_selector] = color;
        return $.getHighlightColor();
    }, // end of $.setHighlightColor()
    
    getHighlightColor : function(options) {
        options = $.extend({}, DEFAULT_OPTIONS, options);
        var color,
            element = options.element.toLowerCase(),
            className = options.className,
            baseNode = options.baseNode,
            css_selector = element + '.' + className,
            test_node = $('<' + element + '/>').addClass(className).css('visibility', 'hidden');
        
        try {
            test_node.appendTo($(baseNode));
            var rgb_color = test_node.css('background-color').toString(),
                color_numbers = rgb_color.match(/\d+/g);
            
            if ( color_numbers.length == 3 ) {
                color = '#' + $.map(color_numbers, function(color_number) {return ( '0' + parseInt(color_number, 10).toString(16) ).substr(-2)}).join('');
            }
            else {
                color = rgb_color;
            }
            test_node.remove();
        }
        catch (error) {
            color = current_color[css_selector];
        }
        return color;
    } // end of $.getHighlightColor()
});

$.fn.highlight = function(keywords, options) {
    options = $.extend({}, DEFAULT_OPTIONS, options);
    if ( Object.prototype.toString.call(keywords) == '[object String]' ) {
        keywords = [keywords];
    }
    if ( ( ! keywords ) || ( ! $.isArray(keywords) ) ) {
        return this;
    }
    var modified_keywords = [];
    
    $.each(keywords, function(index, keyword) {
        if ( keyword ) {
            keyword = keyword.replace(/[.*+?^$|,(){}[\]\-\/\\\s]/g, '\\$&');
            modified_keywords.push(keyword);
        }
    });
    if ( modified_keywords.length < 1 ) {
        return this;
    }
    
    var color = options.color,
        element = options.element.toLowerCase(),
        className = options.className,
        excludeNodes = options.excludeNodes,
        caseSensitive = options.caseSensitive,
        wordsOnly = options.wordsOnly,
        reg_pattern = '(' + modified_keywords.join('|') + ')',
        reg_flags = 'g' + (caseSensitive ? '' : 'i') ,
        reg_keywords,
        exclude_node_dict = {},
        work = $('<div/>');
    
    if ( wordsOnly ) {
        reg_pattern = '\\b' + reg_pattern + '\\b';
    }
    reg_keywords = new RegExp(reg_pattern, reg_flags)
    
    $.each(excludeNodes, function(index, exclude_node) {
        exclude_node_dict[exclude_node.toLowerCase()] = true;
    });
    
    var text_node_count = 0,
        modified_text_node_count = 0;
    
    this.find('*').andSelf().not(excludeNodes.join(',')).contents().filter(function() {
        if ( this.nodeType != 3 ) {
            return false;
        }
        var parent = $(this).parent();
        if ( exclude_node_dict[ parent.get(0).nodeName.toLowerCase() ] ) {
            return false;
        }
        if ( ( parent.hasClass(className) ) && ( parent.get(0).nodeName.toLowerCase() == element ) ) {
            return false;
        }
        return true;
    }).each(function(){
        text_node_count ++;
        
        var text_node = $(this),
            text_fragments = text_node.text().split(reg_keywords);
        
        if ( text_fragments.length <= 1 ) {
            return;
        }
        modified_text_node_count ++;
        
        $.each(text_fragments, function(index, text_fragment) {
            if ( (index % 2) == 1 ) {
                var new_node = $('<' + element + ' class="' + className + '"/>').text(text_fragment);
            }
            else {
                var new_node = work.text(text_fragment).contents();
            }
            text_node.before(new_node);
        });
        text_node.remove();
    });
    
    debug_log('modified text nodes: ' + modified_text_node_count + ' / total text nodes: ' + text_node_count);
    
    return this;
}; // end of $.fn.highlight()


$.fn.unhighlight = function(options) {
    options = $.extend({}, DEFAULT_OPTIONS, options);
    
    var element = options.element.toLowerCase(),
        className = options.className;
    
    var highlight_elements = this.find(element + '.' + className),
        parents = highlight_elements.parent();
    
    debug_log('highlight nodes: ' + highlight_elements.size() + ', parents: ' + parents.size());
    
    highlight_elements.contents().unwrap();
    parents.each(function() {
        this.normalize();
    });
    
    return this;
}; // end of $.fn.unhighlight()

})();

// ■ end of file
