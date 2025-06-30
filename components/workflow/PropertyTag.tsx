import { Node, mergeAttributes } from '@tiptap/core';

export interface PropertyTagOptions {
  HTMLAttributes: Record<string, any>;
}

const PropertyTag = Node.create<PropertyTagOptions>({
  name: 'propertyTag',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: { default: null },
      label: { default: '' },
      description: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-property-tag]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-property-tag': 'true',
          'id': HTMLAttributes.id,
          class:
            'inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold mr-1 property-tag',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        'span',
        { class: 'property-label' },
        HTMLAttributes.label,
      ],
      [
        'button',
        {
          class:
            'ml-1 text-blue-400 hover:text-red-500 focus:outline-none property-tag-remove',
          contenteditable: 'false',
          tabindex: '-1',
          type: 'button',
        },
        '×',
      ],
    ];
  },

  addCommands() {
    return {
      insertPropertyTag:
        (attrs: { id: string; label: string }) =>
        ({ chain }: { chain: any }) => {
          return chain().insertContent({
            type: this.name,
            attrs,
          }).run();
        },
    } as Partial<Record<string, any>>;
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span');
      dom.className = 'inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold mr-1 property-tag relative group';
      dom.setAttribute('data-property-tag', 'true');
      dom.setAttribute('id', node.attrs.id || '');
      dom.setAttribute('contenteditable', 'false');

      const label = document.createElement('span');
      label.className = 'property-label';
      label.textContent = node.attrs.label;
      dom.appendChild(label);

      // Tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg whitespace-pre-line min-w-[120px] max-w-xs';
      tooltip.style.pointerEvents = 'none';
      tooltip.textContent = node.attrs.label + (node.attrs.description ? ('\n' + node.attrs.description) : '');
      dom.appendChild(tooltip);

      dom.onmouseenter = () => { tooltip.classList.remove('hidden'); };
      dom.onmouseleave = () => { tooltip.classList.add('hidden'); };

      const removeBtn = document.createElement('button');
      removeBtn.className = 'ml-1 text-blue-400 hover:text-red-500 focus:outline-none property-tag-remove';
      removeBtn.textContent = '×';
      removeBtn.type = 'button';
      removeBtn.tabIndex = -1;
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos === 'function') {
          editor.chain().focus().deleteRange({ from: getPos(), to: getPos() + node.nodeSize }).run();
        }
      };
      dom.appendChild(removeBtn);

      return {
        dom,
      };
    };
  },
});

export default PropertyTag; 