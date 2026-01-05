import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomDrawer } from "./bottom-drawer";

export interface Filter {
  name: string;
  type:
    | "text"
    | "number"
    | "select"
    | "range"
    | "boolean"
    | "comparison"
    | "domain";
  value: any;
  operator?: string; // For comparison type: ">", "<", ">=", "<=", "="
  domainOperator?: "OR" | "AND"; // For domain type: "OR" or "AND" logic
  options?: string[]; // For select type
  images?: { [key: string]: any }; // For domain type - maps option to image
  min?: number; // For range type
  max?: number; // For range type
  label: string; // Display label
}

interface SearchInputProps
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  filters?: Filter[];
  onFiltersChange?: (filters: Filter[]) => void;
}

export const SearchInput = (props: SearchInputProps) => {
  const {
    value: searchQuery,
    onChangeText: setSearchQuery,
    placeholder = "Search cards...",
    filters = [],
    onFiltersChange,
    ...restProps
  } = props;

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters);

  // Sync localFilters with filters prop
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (index: number, newValue: any) => {
    const updatedFilters = [...localFilters];
    updatedFilters[index] = { ...updatedFilters[index], value: newValue };
    setLocalFilters(updatedFilters);
  };

  const handleApplyFilters = () => {
    if (onFiltersChange) {
      onFiltersChange(localFilters);
    }
    setIsDrawerVisible(false);
  };

  const handleResetFilters = () => {
    const resetFilters = localFilters.map((filter) => ({
      ...filter,
      value:
        filter.type === "boolean"
          ? false
          : filter.type === "number" ||
            filter.type === "range" ||
            filter.type === "comparison"
          ? 0
          : filter.type === "domain"
          ? []
          : "",
      operator: filter.type === "comparison" ? ">=" : filter.operator,
    }));
    setLocalFilters(resetFilters);
  };

  const hasActiveFilters = localFilters.some((filter) => {
    if (filter.type === "boolean") return filter.value === true;
    if (
      filter.type === "number" ||
      filter.type === "range" ||
      filter.type === "comparison"
    )
      return filter.value > 0;
    if (filter.type === "domain")
      return Array.isArray(filter.value) && filter.value.length > 0;
    return (
      filter.value !== "" && filter.value !== null && filter.value !== undefined
    );
  });

  const activeFilterCount = localFilters.filter((filter) => {
    if (filter.type === "boolean") return filter.value === true;
    if (
      filter.type === "number" ||
      filter.type === "range" ||
      filter.type === "comparison"
    )
      return filter.value > 0;
    if (filter.type === "domain")
      return Array.isArray(filter.value) && filter.value.length > 0;
    return (
      filter.value !== "" && filter.value !== null && filter.value !== undefined
    );
  }).length;

  const renderFilterInput = (filter: Filter, index: number) => {
    switch (filter.type) {
      case "text":
        return (
          <TextInput
            style={styles.filterInput}
            value={filter.value}
            onChangeText={(text) => handleFilterChange(index, text)}
            placeholder={`Enter ${filter.label.toLowerCase()}`}
            placeholderTextColor="#64748b"
          />
        );

      case "number":
        return (
          <TextInput
            style={styles.filterInput}
            value={filter.value?.toString() || ""}
            onChangeText={(text) => {
              const num = parseInt(text) || 0;
              handleFilterChange(index, num);
            }}
            keyboardType="numeric"
            placeholder={`Enter ${filter.label.toLowerCase()}`}
            placeholderTextColor="#64748b"
          />
        );

      case "select":
        return (
          <View style={styles.selectContainer}>
            {filter.options?.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.selectOption,
                  filter.value === option && styles.selectOptionActive,
                ]}
                onPress={() => handleFilterChange(index, option)}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    filter.value === option && styles.selectOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        );

      case "range":
        return (
          <View style={styles.rangeContainer}>
            <TextInput
              style={[styles.filterInput, styles.rangeInput]}
              value={filter.value?.toString() || ""}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                handleFilterChange(index, num);
              }}
              keyboardType="numeric"
              placeholder={`${filter.min || 0}`}
              placeholderTextColor="#64748b"
            />
            <Text style={styles.rangeText}>to</Text>
            <TextInput
              style={[styles.filterInput, styles.rangeInput]}
              value={filter.value?.toString() || ""}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                handleFilterChange(index, num);
              }}
              keyboardType="numeric"
              placeholder={`${filter.max || 100}`}
              placeholderTextColor="#64748b"
            />
          </View>
        );

      case "boolean":
        return (
          <Pressable
            style={[
              styles.booleanToggle,
              filter.value && styles.booleanToggleActive,
            ]}
            onPress={() => handleFilterChange(index, !filter.value)}
          >
            <View
              style={[
                styles.booleanThumb,
                filter.value && styles.booleanThumbActive,
              ]}
            />
          </Pressable>
        );

      case "comparison":
        return (
          <View style={styles.comparisonContainer}>
            <View style={styles.operatorContainer}>
              {[">", "<", ">=", "<=", "="].map((op) => (
                <Pressable
                  key={op}
                  style={[
                    styles.operatorButton,
                    filter.operator === op && styles.operatorButtonActive,
                  ]}
                  onPress={() => {
                    const updatedFilters = [...localFilters];
                    updatedFilters[index] = {
                      ...updatedFilters[index],
                      operator: op,
                    };
                    setLocalFilters(updatedFilters);
                  }}
                >
                  <Text
                    style={[
                      styles.operatorButtonText,
                      filter.operator === op && styles.operatorButtonTextActive,
                    ]}
                  >
                    {op}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.filterInput}
              value={filter.value?.toString() || ""}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                handleFilterChange(index, num);
              }}
              keyboardType="numeric"
              placeholder="Enter value"
              placeholderTextColor="#64748b"
            />
          </View>
        );

      case "domain":
        return (
          <View>
            <View style={styles.domainOperatorContainer}>
              <Pressable
                style={[
                  styles.domainOperatorButton,
                  (filter.domainOperator || "OR") === "OR" &&
                    styles.domainOperatorButtonActive,
                ]}
                onPress={() => {
                  const updatedFilters = [...localFilters];
                  updatedFilters[index] = {
                    ...filter,
                    domainOperator: "OR",
                  };
                  setLocalFilters(updatedFilters);
                }}
              >
                <Text
                  style={[
                    styles.domainOperatorText,
                    (filter.domainOperator || "OR") === "OR" &&
                      styles.domainOperatorTextActive,
                  ]}
                >
                  OR (Any)
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.domainOperatorButton,
                  filter.domainOperator === "AND" &&
                    styles.domainOperatorButtonActive,
                ]}
                onPress={() => {
                  const updatedFilters = [...localFilters];
                  updatedFilters[index] = {
                    ...filter,
                    domainOperator: "AND",
                  };
                  setLocalFilters(updatedFilters);
                }}
              >
                <Text
                  style={[
                    styles.domainOperatorText,
                    filter.domainOperator === "AND" &&
                      styles.domainOperatorTextActive,
                  ]}
                >
                  AND (All)
                </Text>
              </Pressable>
            </View>
            <View style={styles.domainContainer}>
              {filter.options?.map((option) => {
                const isSelected = Array.isArray(filter.value)
                  ? filter.value.includes(option)
                  : filter.value === option;
                return (
                  <Pressable
                    key={option}
                    style={styles.domainOption}
                    onPress={() => {
                      // Toggle domain selection (allow multiple)
                      const currentValue = Array.isArray(filter.value)
                        ? filter.value
                        : [];
                      const newValue = currentValue.includes(option)
                        ? currentValue.filter((v) => v !== option)
                        : [...currentValue, option];
                      handleFilterChange(index, newValue);
                    }}
                  >
                    <Image
                      source={filter.images?.[option]}
                      style={[
                        styles.domainImage,
                        { opacity: isSelected ? 1 : 0.2 },
                      ]}
                      resizeMode="contain"
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          {...restProps}
        />
        {filters.length > 0 && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsDrawerVisible(true)}
          >
            <Ionicons
              name={hasActiveFilters ? "funnel" : "funnel-outline"}
              size={20}
              color={hasActiveFilters ? "#3b82f6" : "#94a3b8"}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <BottomDrawer
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        title="Filters"
        fullHeight
        headerRight={
          <TouchableOpacity onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        }
        stickyFooter={
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.filtersContent}>
          {localFilters.map((filter, index) => {
            // Assign colors and icons based on filter type
            const getFilterIcon = () => {
              switch (filter.name) {
                case "rarity":
                  return "diamond-outline";
                case "cardType":
                  return "albums-outline";
                case "setAbv":
                  return "grid-outline";
                case "energy":
                  return "flash-outline";
                case "might":
                  return "shield-outline";
                case "domain":
                  return "planet-outline";
                default:
                  return "options-outline";
              }
            };

            const getFilterColor = () => {
              switch (filter.name) {
                case "rarity":
                  return "#f59e0b"; // amber
                case "cardType":
                  return "#8b5cf6"; // purple
                case "setAbv":
                  return "#06b6d4"; // cyan
                case "energy":
                  return "#3b82f6"; // blue
                case "might":
                  return "#ef4444"; // red
                case "domain":
                  return "#22c55e"; // green
                default:
                  return "#94a3b8";
              }
            };

            return (
              <View key={`${filter.name}-${index}`} style={styles.filterItem}>
                <View style={styles.filterLabelContainer}>
                  <Ionicons
                    name={getFilterIcon() as any}
                    size={18}
                    color={getFilterColor()}
                  />
                  <Text
                    style={[styles.filterLabel, { color: getFilterColor() }]}
                  >
                    {filter.label}
                  </Text>
                </View>
                {renderFilterInput(filter, index)}
              </View>
            );
          })}
        </View>
      </BottomDrawer>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#ffffff",
    height: 60,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  filterButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersContent: {
    padding: 12,
    gap: 12,
  },
  filterItem: {
    gap: 8,
    padding: 16,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.1)",
  },
  filterLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  filterInput: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  selectOptionActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  selectOptionText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
  },
  selectOptionTextActive: {
    color: "#ffffff",
  },
  rangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  booleanToggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#334155",
    padding: 2,
    justifyContent: "center",
  },
  booleanToggleActive: {
    backgroundColor: "#3b82f6",
  },
  booleanThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
  },
  booleanThumbActive: {
    alignSelf: "flex-end",
  },
  comparisonContainer: {
    gap: 12,
  },
  operatorContainer: {
    flexDirection: "row",
    gap: 8,
  },
  operatorButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    minWidth: 50,
    alignItems: "center",
  },
  operatorButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  operatorButtonText: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "600",
  },
  operatorButtonTextActive: {
    color: "#ffffff",
  },
  domainOperatorContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  domainOperatorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    alignItems: "center",
  },
  domainOperatorButtonActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  domainOperatorText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  domainOperatorTextActive: {
    color: "#ffffff",
  },
  domainContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-around",
  },
  domainOption: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  domainImage: {
    width: 56,
    height: 56,
  },
  resetButtonText: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
