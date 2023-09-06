class waffleChart {
    constructor(data, separator) {
        this.data = data;
        this.transfomed;
        this.separator = separator;
        this.ranges;

        this.transform();
    }

    getData() {
        return this.transformed;
    }

    getRanges() {
        return this.ranges;
    }

    transform() {
        let ungrouped = aq.from(this.data)
            .derive({instances: aq.escape(d => Array(parseInt(parseFloat(d.value) * 100)).fill(0)) })
            .unroll('instances')
            .groupby('group')
            .derive({
                index: d => op.row_number() - 1,
            })
            .derive({
                x: aq.escape(d => ((d.index % 10) * 5) + 2), 
                x2: aq.escape(d => ((d.index % 10) * 5) + 6), 
                y: aq.escape(d => (Math.floor(d.index / 10) * 5) + 2), 
                y2: aq.escape(d => (Math.floor(d.index / 10) * 5) + 6 )
            })
            .objects();

        this.ranges = {
            x: [d3.min(ungrouped, d => {return d.x}), d3.max(ungrouped, d => {return d.x2})], 
            y: [d3.min(ungrouped, d => {return d.y}), d3.max(ungrouped, d => {return d.y2})]
        };

        this.transformed = aq.from(ungrouped)
            .derive({ coords: d => [[d.x, d.y],[d.x2, d.y],[d.x2, d.y2],[d.x, d.y2]] })
            .select(['group','detail','value','coords'])
            .objects();
    }
}