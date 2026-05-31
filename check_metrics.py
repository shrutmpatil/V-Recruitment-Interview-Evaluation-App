from typing import List, Dict

def generate_report_values_table():
    """
    Generates a simple table showing the required quantitative metric values, 
    using contextual phrasing where rounding/simplification is necessary for the narrative.
    """
    
    # Define the final set of metrics and the CONTEXTUALIZED VALUE TO INSERT 
    # into the report's running text (Sections 5.3, 5.5, 6.1).
    METRICS_DATA: List[Dict[str, str]] = [
        {
            "Metric Name": "API Latency",
            # Missing in narrative, use the precise measured value.
            "Value to Insert": "95 ms"
        },
        {
            "Metric Name": "Data Sync Delay",
            # Found in narrative as 'sub-100 ms', maintain this contextual phrasing.
            "Value to Insert": "sub-100 ms"
        },
        {
            "Metric Name": "Dashboard Render Time",
            # Found in narrative as 'sub-second', maintain this contextual phrasing.
            "Value to Insert": "sub-second"
        },
        {
            "Metric Name": "AI Summary Latency (Max)",
            # Missing in narrative, use the precise acceptance criteria value.
            "Value to Insert": "< 2 s"
        },
        {
            "Metric Name": "PDF Report Time (Max)",
            # Missing in narrative, use the rounded/contextual phrasing.
            "Value to Insert": "under 5 seconds"
        },
        {
            "Metric Name": "Lighthouse Score",
            # Missing in narrative, use the precise measured value.
            "Value to Insert": "92%"
        },
        {
            "Metric Name": "AI Semantic Accuracy",
            # Found in narrative as 'over 90 %', maintain this contextual phrasing.
            "Value to Insert": "over 90 %"
        },
        {
            "Metric Name": "Time Efficiency (Compilation)",
            # Found in narrative as 'one minute', maintain this contextual phrasing.
            "Value to Insert": "under one minute"
        },
        {
            "Metric Name": "Concurrent User Capacity",
            # Found in narrative as '1,000', use the full phrasing for insertion.
            "Value to Insert": "1,000 sessions"
        },
    ]

    # --- Print Final Reference Table ---
    
    # Define column widths for alignment
    COL_WIDTHS = [35, 30]
    
    def print_separator():
        print("|" + "-" * COL_WIDTHS[0] + "|" + "-" * COL_WIDTHS[1] + "|")

    print("\n" + "=" * 67)
    print("      QUANTITATIVE METRICS: CONTEXTUAL INSERTION VALUES      ")
    print("=" * 67)
    
    # Print Header
    print(f"| {'Metric Name':<{COL_WIDTHS[0]-1}} | {'Value to Insert':<{COL_WIDTHS[1]-1}} |")
    print_separator()
    
    # Print Rows
    for row in METRICS_DATA:
        print(f"| {row['Metric Name']:<{COL_WIDTHS[0]-1}} | {row['Value to Insert']:<{COL_WIDTHS[1]-1}} |")

    print_separator()
    print("\nACTION: Use the 'Value to Insert' column to update all quantitative claims in Sections 5.3, 5.5, and 6.1.")

if __name__ == "__main__":
    generate_report_values_table()