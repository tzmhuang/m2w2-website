class LeaderboardTable {
    constructor() {
        this.data = null;
        this.currentSet = 'eval_set';
        this.sortColumn = 'success_rate';
        this.sortDirection = 'desc';
        this.init();
    }

    async init() {
        await this.loadData();
        this.createTable();
        this.setupTabs();
    }

    async loadData() {
        try {
            const response = await fetch('./leaderboard_data.json');
            const jsonData = await response.json();
            this.data = jsonData.leaderboardData;
            console.log('Leaderboard data loaded:', this.data);
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
        }
    }

    createTable() {
        const tableContainer = document.querySelector('#m2w2-table');
        if (!tableContainer) {
            console.error('Table container not found!');
            return;
        }

        // Create tabs
        // const tabsHtml = `
        //     <div class="tabs is-centered">
        //         <ul>
        //             <li class="tab-item ${this.currentSet === 'public_set' ? 'is-active' : ''}" data-set="public_set">
        //                 <a>
        //                     <span class="icon is-small"><i class="fas fa-users" aria-hidden="true"></i></span>
        //                     <span>Public Set</span>
        //                 </a>
        //             </li>
        //             <li class="tab-item ${this.currentSet === 'eval_set' ? 'is-active' : ''}" data-set="eval_set">
        //                 <a>
        //                     <span class="icon is-small"><i class="fas fa-vial" aria-hidden="true"></i></span>
        //                     <span>Full Set</span>
        //                 </a>
        //             </li>
        //         </ul>
        //     </div>
        //     <div class="leaderboard-info-box">
        //         <div class="content has-text-justified">
        //         <md-block>
        //             **Public Set** is a subset of tasks with evaluation rubrics released for public access. [[Code Coming Soon](https://github.com/osu-nlp-group/mind2web2)]

        //             **Full Set** is the complete set of tasks with evaluation rubrics withheld.
        //         </md-block>
        //         </div>
        //     </div>
        // `;

        const tabsHtml = `
        `; // Placeholder for tabs HTML if needed

        // Insert tabs before the table wrapper
        const tableWrapper = tableContainer.parentElement;
        tableWrapper.insertAdjacentHTML('beforebegin', tabsHtml);

        this.renderTable();
    }

    renderTable() {
        const tableContainer = document.querySelector('#m2w2-table');
        
        if (!tableContainer) {
            console.error('Table container not found!');
            return;
        }

        // Create single table with sticky header
        let tableHtml = `
            <thead>
                <tr>
                    <th class="has-text-left">Agent</th>
                    <th class="has-text-centered sortable-header" data-column="date">
                        Date ${this.getSortIcon('date')}
                    </th>
                    <th class="has-text-centered sortable-header" data-column="partial_completion">
                        Partial Completion ${this.getSortIcon('partial_completion')}
                    </th>
                    <th class="has-text-centered sortable-header" data-column="success_rate">
                        Success Rate ${this.getSortIcon('success_rate')}
                    </th>
                    <th class="has-text-centered sortable-header" data-column="pass3">
                        Pass@3 ${this.getSortIcon('pass3')}
                    </th>
                    <th class="has-text-centered sortable-header" data-column="time">
                        Time (min) ${this.getSortIcon('time')}
                    </th>
                    <th class="has-text-centered sortable-header" data-column="answer_length">
                        Answer Length ${this.getSortIcon('answer_length')}
                    </th>
                </tr>
            </thead>
            <tbody>
        `;

        // Sort the data
        const sortedData = this.getSortedData();

        if (sortedData && sortedData.length > 0) {

            const maxValues = this.findMaxValues(sortedData);

            sortedData.forEach((model, index) => {
                const info = model.info;
                const results = model[this.currentSet];

                let agentNameHtml;
                if (info.url && info.url.trim() !== "") {
                    // Create clickable link that opens in new tab
                    agentNameHtml = `<a href="${info.url}" target="_blank" class="agent-link" rel="noopener noreferrer">
                        ${info.name}
                    </a>`;
                } else {
                    // No URL available, just show the name
                    agentNameHtml = `${info.name}`;
                }

                tableHtml += `
                    <tr class="model-row" data-rank="${index + 1}">
                        <td class="model-name-cell">
                            <div class="model-info">
                                ${agentNameHtml}
                            </div>
                        </td>
                        <td class="has-text-centered">${info.date}</td>
                        <td class="has-text-centered metric-cell">${this.formatMetric(results.partial_completion, maxValues.partial_completion)}</td>
                        <td class="has-text-centered metric-cell">${this.formatMetric(results.success_rate, maxValues.success_rate)}</td>
                        <td class="has-text-centered metric-cell">${this.formatMetric(results.pass3, maxValues.pass3)}</td>
                        <td class="has-text-centered metric-cell">${this.formatMetric(results.time, maxValues.time)}</td>
                        <td class="has-text-centered metric-cell">${this.formatMetric(results.answer_length, maxValues.answer_length)}</td>
                    </tr>
                `;
            });
        } else {
            tableHtml += `
                <tr>
                    <td colspan="5" class="has-text-centered has-text-grey">
                        <em>No data available</em>
                    </td>
                </tr>
            `;
        }

        tableHtml += '</tbody>';

        // Replace table content
        tableContainer.innerHTML = tableHtml;

        // Setup sorting
        this.setupSorting();
    }

    getSortIcon(column) {
        if (this.sortColumn === column) {
            return this.sortDirection === 'asc' ? 
                '<i class="fas fa-arrow-up"></i>' : 
                '<i class="fas fa-arrow-down"></i>';
        }
        return '<i class="fas fa-sort" style="opacity: 0.3;"></i>';
    }

    findMaxValues(data) {
        const maxValues = {
            partial_completion: -Infinity,
            success_rate: -Infinity,
            pass3: -Infinity
        };

        data.forEach(model => {
            const results = model[this.currentSet];
            
            // Check each metric
            ['partial_completion', 'success_rate', 'pass3'].forEach(metric => {
                const value = results[metric];
                if (value !== "-" && value !== null && value !== undefined) {
                    // Parse the numeric value (handle strings with ± symbols)
                    let numValue;
                    if (typeof value === 'string') {
                        numValue = parseFloat(value.replace(/[,±]/g, '').split('±')[0]);
                    } else {
                        numValue = parseFloat(value);
                    }
                    
                    if (!isNaN(numValue) && numValue > maxValues[metric]) {
                        maxValues[metric] = numValue;
                    }
                }
            });
        });

        return maxValues;
    }

    getSortedData() {
        if (!this.data || this.data.length === 0) {
            console.warn('No data available for sorting');
            return [];
        }

        let sortedData = [...this.data];
        
        return sortedData.sort((a, b) => {
            let aValue, bValue;
            
            if (this.sortColumn === 'date') {
                aValue = new Date(a.info?.date || 0);
                bValue = new Date(b.info?.date || 0);
            } else {
                aValue = a[this.currentSet]?.[this.sortColumn];
                bValue = b[this.currentSet]?.[this.sortColumn];
                
                // Handle "-" values
                if (aValue === "-" && bValue === "-") return 0;
                if (aValue === "-") return this.sortDirection === 'asc' ? 1 : -1;
                if (bValue === "-") return this.sortDirection === 'asc' ? -1 : 1;
                
                // Parse numbers
                if (typeof aValue === 'string') {
                    aValue = parseFloat(aValue.replace(/[,±]/g, '').split('±')[0]);
                }
                if (typeof bValue === 'string') {
                    bValue = parseFloat(bValue.replace(/[,±]/g, '').split('±')[0]);
                }
            }
            
            // Sort based on direction
            if (this.sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }

    setupSorting() {
        const sortableHeaders = document.querySelectorAll('.sortable-header');
        
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'desc';
                }
                
                this.renderTable();
            });
        });
    }

    formatMetric(value, maxValue = null) {
        if (value === "-" || value === null || value === undefined) {
            return '<span class="has-text-grey">-</span>';
        }

        // If maxValue is provided, check if this value should be bolded
        if (maxValue !== null) {
            // Parse the numeric value for comparison
            let numValue;
            if (typeof value === 'string') {
                numValue = parseFloat(value.replace(/[,±]/g, '').split('±')[0]);
            } else {
                numValue = parseFloat(value);
            }

            // Check if this is the maximum value (with small epsilon for floating point comparison)
            const isMaxValue = !isNaN(numValue) && Math.abs(numValue - maxValue) < 0.001;

            if (isMaxValue) {
                return `<span class="metric-max"><strong>${value}</strong></span>`;
            }
        }
        
        return value;
    }

    setupTabs() {
        const tabItems = document.querySelectorAll('.tab-item');
        
        tabItems.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                tabItems.forEach(t => t.classList.remove('is-active'));
                tab.classList.add('is-active');
                
                this.currentSet = tab.dataset.set;
                this.renderTable();
            });
        });
    }
}

// Initialize the leaderboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new LeaderboardTable();
});