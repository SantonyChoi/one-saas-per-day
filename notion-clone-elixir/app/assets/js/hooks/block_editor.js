const BlockEditor = {
  mounted() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
  },

  destroyed() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },

  handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.pushEvent('add_block', {});
    }

    if (event.key === 'Escape') {
      this.pushEvent('stop_editing', {});
    }
  }
};

export default BlockEditor; 